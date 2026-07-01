import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { resolveProductCategory } from "@/lib/catalog/category-resolver";
import { calculateDiscoveryPrice, isLikelyMicroProduct } from "@/lib/pricing/discovery-pricing";
import { resolveProductImage } from "@/lib/sourcing/image-pipeline";
import { isInvalidProductImageUrl, isStockPlaceholderUrl } from "@/lib/sourcing/product-image-url";
import { customerFacingDescription, customerFacingHighlights, isBoilerplateDescription, parseProductEnrichment } from "@/types/product-enrichment";
import { containsSearchSnippetJunk, isPollutedListingCopy } from "@/lib/sourcing/listing-copy-sanitizer";
import { isCatalogPageTitle, isSupplierBrandedCatalogTitle, normalizeCustomerProductTitle } from "@/lib/sourcing/wholesale-listing-quality";
import { stockFromMetadata } from "@/lib/catalog/product-stock-label";
import {
  stockOriginFromSupplierRegion,
  stockStatusFromSupplierRegion,
} from "@/lib/sourcing/supplier-stock";
import type { Database } from "@/types/database";

function needsDescriptionRepair(description: string): boolean {
  const trimmed = description.trim();
  if (!trimmed) return true;
  return (
    isBoilerplateDescription(trimmed) ||
    isPollutedListingCopy(trimmed) ||
    containsSearchSnippetJunk(trimmed)
  );
}

function repairDescription(name: string, description: string): string | null {
  const cleaned = customerFacingDescription(description);
  if (cleaned.length >= 24) return null;
  const lead = name.trim();
  if (!lead) return null;
  return `${lead}. Available to order with fast local fulfilment.`;
}

/** Patch boilerplate copy and missing images without wiping the catalog row. */
export async function repairProductListingIfNeeded(slugs: string[]): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createServiceClient();
  for (const slug of slugs) {
    const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
    if (!data) continue;

    const updates: Record<string, unknown> = {};
    const meta = (data.metadata ?? {}) as Record<string, unknown>;
    const name = String(data.name ?? "");
    const description = String(data.description ?? "");
    const sourcing = meta.sourcing as { query?: string } | undefined;
    const query = sourcing?.query ?? name;

    const sourceUrl = String(data.source_url ?? "");
    const domain = sourceUrl.includes("://")
      ? new URL(sourceUrl).hostname.replace(/^www\./, "")
      : "";

    if (isCatalogPageTitle(name) || isSupplierBrandedCatalogTitle(name, domain)) {
      const fixedName = normalizeCustomerProductTitle(query, name, domain ? [domain] : []);
      if (fixedName && fixedName !== name) updates.name = fixedName;
    }

    const displayName = String(updates.name ?? name);

    if (needsDescriptionRepair(description)) {
      const fixed = repairDescription(displayName, description);
      if (fixed) updates.description = fixed;
    }

    const enrichment = parseProductEnrichment(meta);
    const cleanedHighlights = customerFacingHighlights(enrichment.highlights);
    const summaryJunk =
      enrichment.summary &&
      (!customerFacingDescription(enrichment.summary) ||
        containsSearchSnippetJunk(enrichment.summary));

    if (
      cleanedHighlights.length !== enrichment.highlights.length ||
      enrichment.highlights.some((h) => containsSearchSnippetJunk(h)) ||
      summaryJunk
    ) {
      updates.metadata = {
        ...meta,
        highlights: cleanedHighlights,
        ...(summaryJunk ? { summary: undefined } : {}),
      };
    }

    if (Object.keys(updates).length) {
      await supabase
        .from("products")
        .update(updates as Database["public"]["Tables"]["products"]["Update"])
        .eq("slug", slug);
    }
  }

  void repairProductImagesIfNeeded(slugs);
}

/** Fast image-only repair — never re-runs full discovery search. */
export async function repairMissingProductImages(
  slugs: string[],
  budgetMs = 50_000,
): Promise<void> {
  if (!isSupabaseConfigured() || !slugs.length) return;

  const deadline = Date.now() + budgetMs;
  const supabase = createServiceClient();

  for (const slug of slugs) {
    if (Date.now() > deadline) break;

    const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
    if (!data) continue;

    const current = (data.enhanced_image_url ?? data.image_url) as string | null;
    if (!isInvalidProductImageUrl(current) && current?.includes("/discovered/")) continue;

    const meta = (data.metadata ?? {}) as Record<string, unknown>;
    const sourcing = meta.sourcing as { query?: string } | undefined;
    const query = sourcing?.query ?? (data.name as string);
    const enrichment = parseProductEnrichment(meta);

    const supplierUrl = (data.source_url as string | null) ?? "";
    const supplierName = (data.source_name as string | null) ?? "Supplier";
    const supplierUrls = [
      supplierUrl,
      enrichment.supplierIntel?.primary?.supplierUrl,
      ...(enrichment.supplierIntel?.alternates?.map((a) => a.supplierUrl) ?? []),
    ].filter((u): u is string => typeof u === "string" && u.startsWith("http"));

    if (!supplierUrls.length) continue;

    let fixed: Awaited<ReturnType<typeof resolveProductImage>> | null = null;
    for (const url of [...new Set(supplierUrls)]) {
      fixed = await resolveProductImage({
        name: data.name as string,
        slug: data.slug as string,
        category: data.category as string,
        supplierUrl: url,
        supplierName,
        searchQuery: query,
      });
      if (fixed?.enhancedImageUrl || fixed?.imageUrl) break;
    }

    if (!fixed?.imageUrl) continue;

    await supabase
      .from("products")
      .update({
        image_url: fixed.imageUrl,
        enhanced_image_url: fixed.enhancedImageUrl ?? fixed.imageUrl,
        ...(fixed.listingUrl ? { source_url: fixed.listingUrl } : {}),
      } as Database["public"]["Tables"]["products"]["Update"])
      .eq("slug", slug);
  }
}

export async function repairProductImagesIfNeeded(slugs: string[]): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createServiceClient();

  for (const slug of slugs) {
    const { data } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
    if (!data) continue;

    const updates: Record<string, unknown> = {};
    const meta = (data.metadata ?? {}) as Record<string, unknown>;
    const sourcing = meta.sourcing as { query?: string } | undefined;
    const query = sourcing?.query ?? (data.name as string);

    const resolvedCategory = resolveProductCategory(
      query,
      data.name as string,
      data.category as string,
    );
    if (resolvedCategory !== data.category) {
      updates.category = resolvedCategory;
    }

    const micro = isLikelyMicroProduct(query, data.name as string, resolvedCategory);
    const wholesaleInput = micro ? 0.02 : Number(data.base_price) || 0;
    const pricing = calculateDiscoveryPrice(wholesaleInput, resolvedCategory);
    const retail = Number(data.retail_price) || 0;
    const shouldReprice = micro && retail > pricing.retailPrice * 1.2;

    if (shouldReprice) {
      updates.base_price = pricing.basePriceZar;
      updates.retail_price = pricing.retailPrice;
      updates.markup_percent = pricing.markupPercent;
      updates.metadata = {
        ...meta,
        minimumOrderQuantity: pricing.minimumOrderQuantity,
        unitLabel: pricing.unitLabel,
        pricingNote: pricing.pricingNote,
        isMicroItem: pricing.isMicroItem,
      };
    }

    const current = (data.enhanced_image_url ?? data.image_url) as string | null;
    const imageCategory = (updates.category ?? data.category) as string;
    let supplierUrl = (data.source_url as string | null) ?? "";
    let supplierName = (data.source_name as string | null) ?? "Supplier";
    let candidateUrl = isStockPlaceholderUrl(current) ? undefined : (current ?? undefined);

    const needsImageRepair =
      isInvalidProductImageUrl(current) ||
      !data.enhanced_image_url ||
      (typeof data.enhanced_image_url === "string" &&
        !data.enhanced_image_url.includes("/discovered/"));

    if (needsImageRepair) {
      const enrichment = parseProductEnrichment(meta);
      const supplierUrls = [
        supplierUrl,
        enrichment.supplierIntel?.primary?.supplierUrl,
        ...(enrichment.supplierIntel?.alternates.map((a) => a.supplierUrl) ?? []),
        candidateUrl,
      ].filter((u): u is string => typeof u === "string" && u.length > 10);

      let fixed: Awaited<ReturnType<typeof resolveProductImage>> | null = null;
      for (const url of [...new Set(supplierUrls)]) {
        fixed = await resolveProductImage({
          name: data.name as string,
          slug: data.slug as string,
          category: imageCategory,
          supplierUrl: url.includes("http") ? url : supplierUrl,
          supplierName,
          candidateUrl,
          searchQuery: query || (data.name as string),
        });
        if (fixed.imageUrl) break;
      }
      if (fixed?.imageUrl) {
        updates.image_url = fixed.imageUrl;
        updates.enhanced_image_url = fixed.enhancedImageUrl;
        if (fixed.listingUrl) {
          updates.source_url = fixed.listingUrl;
        } else if (supplierUrl && supplierUrl !== data.source_url) {
          updates.source_url = supplierUrl;
        }
      } else if (isInvalidProductImageUrl(current)) {
        updates.image_url = null;
        updates.enhanced_image_url = null;
      }
    }

    const enrichment = parseProductEnrichment(updates.metadata ?? meta);
    const supplierRegion = enrichment.supplierIntel?.primary.region;
    if (supplierRegion === "south_africa" && data.stock_status !== "in_stock") {
      updates.stock_status = "in_stock";
      updates.metadata = {
        ...((updates.metadata ?? meta) as Record<string, unknown>),
        stock_origin: "sa_warehouse",
      };
    } else if (
      supplierRegion &&
      supplierRegion !== "south_africa" &&
      (data.stock_status === "sourced" || !data.stock_status)
    ) {
      updates.stock_status = "available_international";
    }

    const stock = stockFromMetadata(updates.metadata ?? data.metadata);
    if (!stock) {
      updates.metadata = {
        ...((updates.metadata ?? meta) as Record<string, unknown>),
        quantity: 20,
      };
    }

    if (Object.keys(updates).length) {
      await supabase
        .from("products")
        .update(updates as Database["public"]["Tables"]["products"]["Update"])
        .eq("slug", slug);
    }
  }
}
