import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { resolveProductCategory } from "@/lib/catalog/category-resolver";
import { calculateDiscoveryPrice, isLikelyMicroProduct } from "@/lib/pricing/discovery-pricing";
import type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence";
import { extractProductIntelligence } from "@/lib/sourcing/product-intelligence";
import { resolveProductImage } from "@/lib/sourcing/image-pipeline";
import { isInvalidProductImageUrl, isStockPlaceholderUrl } from "@/lib/sourcing/product-image-url";
import { parseProductEnrichment } from "@/types/product-enrichment";
import { stockFromMetadata } from "@/lib/catalog/product-stock-label";
import {
  stockOriginFromSupplierRegion,
  stockStatusFromSupplierRegion,
} from "@/lib/sourcing/supplier-stock";
import type { Database } from "@/types/database";

export async function repairProductImagesIfNeeded(slugs: string[]): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createServiceClient();
  const draftCache = new Map<string, Map<string, DiscoveredProductDraft>>();

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
      const sourceIsPlaceholder =
        !supplierUrl || supplierUrl.includes("almostanything.store/sourced");

      if (sourceIsPlaceholder && query.length > 2) {
        if (!draftCache.has(query)) {
          const drafts = await extractProductIntelligence(query);
          draftCache.set(query, new Map(drafts.map((d) => [d.slug, d])));
        }
        const draft = draftCache.get(query)?.get(slug);
        if (draft) {
          supplierUrl = draft.supplierUrl;
          supplierName = draft.supplierName;
          candidateUrl = draft.candidateImageUrl;
          if (draft.supplierUrl && draft.supplierUrl !== data.source_url) {
            updates.source_url = draft.supplierUrl;
            updates.source_name = draft.supplierName;
          }
          if (draft.supplierIntel) {
            const region = draft.supplierIntel.primary.region;
            updates.stock_status = stockStatusFromSupplierRegion(region);
            updates.metadata = {
              ...((updates.metadata ?? meta) as Record<string, unknown>),
              supplierIntel: draft.supplierIntel,
              stock_origin: stockOriginFromSupplierRegion(region),
            };
          }
        }
      }

      const enrichment = parseProductEnrichment(meta);
      const supplierUrls = [
        supplierUrl,
        enrichment.supplierIntel?.primary.supplierUrl,
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
