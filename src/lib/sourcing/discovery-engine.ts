import "server-only";

/**
 * Discovery orchestrator — parallel product intelligence + image resolution, then ingest.
 */

import { extractProductIntelligence } from "@/lib/sourcing/product-intelligence";
import {
  attachImages,
  persistDiscoveredProducts,
} from "@/lib/sourcing/discovery-persist";
import { productsNeedRediscovery } from "@/lib/sourcing/discovery-rediscovery";
import { repairProductImagesIfNeeded } from "@/lib/sourcing/discovery-repair";
import { resolveProductImagesBatch } from "@/lib/sourcing/image-pipeline";
import { logSearchEvent } from "@/services/search-analytics-service";
import { invalidateCatalogCache } from "@/lib/catalog/catalog-source";
import { searchCatalogProductSlugs } from "@/services/product-service";

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

async function runDiscovery(query: string): Promise<DiscoveryResult> {
  const started = Date.now();
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { query: trimmed, discovered: 0, slugs: [], products: [], durationMs: 0 };
  }

  const existingSlugs = await searchCatalogProductSlugs(trimmed);
  if (existingSlugs.length > 0 && !(await productsNeedRediscovery(existingSlugs, trimmed))) {
    await repairProductImagesIfNeeded(existingSlugs);
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

  const drafts = await extractProductIntelligence(trimmed);

  const images = await resolveProductImagesBatch(
    drafts.map((d) => ({
      name: d.name,
      slug: d.slug,
      category: d.category,
      supplierUrl: d.supplierUrl,
      supplierName: d.supplierName,
      candidateUrl: d.candidateImageUrl,
      searchQuery: trimmed,
    })),
  );

  const enriched = drafts.map((draft, i) => attachImages(draft, images[i], trimmed));
  const slugs = await persistDiscoveredProducts(trimmed, enriched);

  if (slugs.length) invalidateCatalogCache();

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
