import "server-only";

/**
 * Discovery orchestrator — parallel product intelligence + image resolution, then ingest.
 */

import { extractProductIntelligence } from "@/lib/sourcing/product-intelligence";
import {
  attachImages,
  deleteDiscoveredProductsBySlugs,
  persistDiscoveredProducts,
} from "@/lib/sourcing/discovery-persist";
import { productsNeedRediscovery } from "@/lib/sourcing/discovery-rediscovery";
import { repairProductListingIfNeeded, repairMissingProductImages } from "@/lib/sourcing/discovery-repair";
import { isInvalidProductImageUrl } from "@/lib/sourcing/product-image-url";
import { resolveProductImagesBatch } from "@/lib/sourcing/image-pipeline";
import type { ImageResolveInput, ResolvedImage } from "@/lib/sourcing/image-pipeline.types";
import { logSearchEvent } from "@/services/search-analytics-service";
import { invalidateCatalogCache } from "@/lib/catalog/catalog-source";
import { searchCatalogProductSlugs } from "@/services/product-service";
import { enrichDraftsBatch } from "@/lib/sourcing/product-enrichment-engine";

const activeDiscoveries = new Map<string, Promise<DiscoveryResult>>();

export type DiscoveryResult = {
  query: string;
  discovered: number;
  slugs: string[];
  products: { slug: string; name: string; retailPrice: number }[];
  durationMs: number;
  cached?: boolean;
};

export async function discoverAndIngestProducts(query: string): Promise<DiscoveryResult> {
  const key = query.trim().toLowerCase();
  if (key.length < 2) {
    return { query: key, discovered: 0, slugs: [], products: [], durationMs: 0 };
  }

  const inFlight = activeDiscoveries.get(key);
  if (inFlight) return inFlight;

  const job = runDiscovery(query).finally(() => {
    activeDiscoveries.delete(key);
  });
  activeDiscoveries.set(key, job);
  return job;
}

const EMPTY_IMAGE: ResolvedImage = { imageUrl: null, enhancedImageUrl: null };

async function slugsMissingImages(slugs: string[]): Promise<string[]> {
  if (!slugs.length) return [];

  const { createServiceClient, isSupabaseConfigured } = await import("@/lib/supabase/admin");
  if (!isSupabaseConfigured()) return slugs;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("slug, image_url, enhanced_image_url")
    .in("slug", slugs);

  return (data ?? [])
    .filter((row) => isInvalidProductImageUrl((row.enhanced_image_url ?? row.image_url) as string | null))
    .map((row) => row.slug as string);
}

async function resolveProductImagesWithBudget(
  items: ImageResolveInput[],
  budgetMs: number,
): Promise<ResolvedImage[]> {
  if (!items.length) return [];

  let settled = false;
  const batch = resolveProductImagesBatch(items).then((images) => {
    settled = true;
    return images;
  });

  const timeout = new Promise<ResolvedImage[]>((resolve) => {
    setTimeout(() => {
      if (!settled) resolve(items.map(() => EMPTY_IMAGE));
    }, budgetMs);
  });

  return Promise.race([batch, timeout]);
}

async function runDiscovery(query: string): Promise<DiscoveryResult> {
  const started = Date.now();
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { query: trimmed, discovered: 0, slugs: [], products: [], durationMs: 0 };
  }

  const existingSlugs = await searchCatalogProductSlugs(trimmed);
  if (existingSlugs.length > 0) {
    await repairProductListingIfNeeded(existingSlugs);
    const stale = await productsNeedRediscovery(existingSlugs, trimmed);
    if (!stale) {
      const needsImages = await slugsMissingImages(existingSlugs);
      if (needsImages.length) {
        await repairMissingProductImages(needsImages, 20_000);
      }
      invalidateCatalogCache();
      return {
        query: trimmed,
        discovered: existingSlugs.length,
        slugs: existingSlugs,
        products: [],
        durationMs: Date.now() - started,
        cached: true,
      };
    }
    await deleteDiscoveredProductsBySlugs(existingSlugs);
    invalidateCatalogCache();
  }

  const drafts = await extractProductIntelligence(trimmed);
  if (process.env.DISCOVERY_DEBUG === "1") {
    console.error("[discovery]", trimmed, "drafts:", drafts.length, drafts.map((d) => d.name));
  }

  // Enrich each draft by going to the actual supplier page — fixes wrong names,
  // bad descriptions, missing features and wrong images. The snippet-based copy
  // from DuckDuckGo is replaced with real page content read by Claude.
  const enrichedDrafts = await enrichDraftsBatch(drafts, trimmed);
  if (process.env.DISCOVERY_DEBUG === "1") {
    console.error("[discovery] enriched", enrichedDrafts.length, "drafts");
  }

  const images = await resolveProductImagesWithBudget(
    enrichedDrafts.map((d) => ({
      name: d.name,
      slug: d.slug,
      category: d.category,
      supplierUrl: d.supplierUrl,
      supplierName: d.supplierName,
      candidateUrl: d.candidateImageUrl,
      searchQuery: trimmed,
    })),
    45_000,
  );

  const enriched = enrichedDrafts.map((draft, i) => attachImages(draft, images[i], trimmed));
  const slugs = await persistDiscoveredProducts(trimmed, enriched);

  if (slugs.length) {
    invalidateCatalogCache();
    await repairMissingProductImages(slugs, 45_000);
    invalidateCatalogCache();
  }

  void logSearchEvent({
    query: trimmed,
    inputMethod: "text",
    source: "discovery_engine",
    resultCount: slugs.length,
    metadata: { slugs, durationMs: Date.now() - started },
  });

  return {
    query: trimmed,
    discovered: slugs.length,
    slugs,
    products: enriched
      .filter((p) => slugs.includes(p.slug))
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        retailPrice: p.retailPrice,
      })),
    durationMs: Date.now() - started,
  };
}

/** Fire-and-forget discovery when search results are thin. */
export function triggerBackgroundDiscovery(query: string, resultCount: number): void {
  if (!query.trim() || resultCount >= 4) return;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const key = process.env.INTERNAL_API_KEY;
  if (!key) return;

  void fetch(`${base}/api/internal/sourcing/discover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({ query: query.trim() }),
  }).catch(() => {
    /* background */
  });
}
