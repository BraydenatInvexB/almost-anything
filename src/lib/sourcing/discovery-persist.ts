import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { resolveProductCategory } from "@/lib/catalog/category-resolver";
import {
  calculateDiscoveryPrice,
  type DiscoveryPriceResult,
} from "@/lib/pricing/discovery-pricing";
import { hasPublishablePrice } from "@/lib/sourcing/wholesale-listing-quality";
import type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence";
import { buildProductMetadata } from "@/types/product-enrichment";
import { ensureVariantStock } from "@/lib/catalog/product-stock-label";
import {
  stockOriginFromSupplierRegion,
  stockStatusFromSupplierRegion,
} from "@/lib/sourcing/supplier-stock";
import type { Database } from "@/types/database";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

export type EnrichedDraft = DiscoveredProductDraft & {
  imageUrl: string | null;
  enhancedImageUrl: string | null;
  listingUrl?: string;
  retailPrice: number;
  pricing: DiscoveryPriceResult;
};

export function attachImages(
  draft: DiscoveredProductDraft,
  image: { imageUrl: string | null; enhancedImageUrl: string | null; listingUrl?: string },
  query: string,
): EnrichedDraft {
  const category = resolveProductCategory(query, draft.name, draft.category);
  const pricing = calculateDiscoveryPrice(draft.basePrice, category, { inputIsZar: true });

  const imageUrl = image.imageUrl ?? draft.candidateImageUrl ?? null;
  const enhancedImageUrl =
    image.enhancedImageUrl ?? image.imageUrl ?? draft.candidateImageUrl ?? null;

  return {
    ...draft,
    category,
    imageUrl,
    enhancedImageUrl,
    listingUrl: image.listingUrl,
    supplierUrl: image.listingUrl ?? draft.supplierUrl,
    retailPrice: pricing.retailPrice,
    pricing,
  };
}

export async function persistDiscoveredProducts(
  query: string,
  products: EnrichedDraft[],
): Promise<string[]> {
  if (!isSupabaseConfigured() || !products.length) return [];

  const supabase = createServiceClient();
  const slugs: string[] = [];

  for (const p of products) {
    if (!hasPublishablePrice(query, p.basePrice, p.retailPrice)) continue;

    const supplierUrl =
      p.supplierUrl.includes("almostanything.store/sourced") && p.supplierIntel?.primary.supplierUrl
        ? p.supplierIntel.primary.supplierUrl
        : p.supplierUrl;

    if (!supplierUrl || supplierUrl.includes("almostanything.store/sourced")) continue;

    const recordSupplierUrl = supplierUrl;
    const recordSupplierName =
      p.supplierName === "Pending supplier match" && p.supplierIntel?.primary.supplierName
        ? p.supplierIntel.primary.supplierName
        : p.supplierName;

    const variants = p.variants.options.length ? ensureVariantStock(p.variants) : null;
    const quantity = variants?.variants.reduce((s, v) => s + (v.stock ?? 10), 0) ?? 10;
    const supplierRegion = p.supplierIntel?.primary.region;

    const metadata = {
      ...buildProductMetadata({
        variants,
        highlights: p.highlights,
        specifications: p.specifications,
        summary: p.summary,
        sourcing: {
          query,
          discoveredAt: new Date().toISOString(),
          supplierName: p.supplierName,
        },
        supplierIntel: p.supplierIntel,
        minimumOrderQuantity: p.pricing.minimumOrderQuantity,
        unitLabel: p.pricing.unitLabel,
        pricingNote: p.pricing.pricingNote,
        isMicroItem: p.pricing.isMicroItem,
      }),
      quantity,
      stock_origin: stockOriginFromSupplierRegion(supplierRegion),
    };

    const record: ProductInsert = {
      slug: p.slug,
      name: p.name,
      description: p.description,
      category: p.category as ProductInsert["category"],
      base_price: p.pricing.basePriceZar,
      retail_price: p.pricing.retailPrice,
      markup_percent: p.pricing.markupPercent,
      image_url: p.imageUrl,
      enhanced_image_url: p.enhancedImageUrl,
      source_url: recordSupplierUrl,
      source_name: recordSupplierName,
      delivery_days_min: p.deliveryDaysMin,
      delivery_days_max: p.deliveryDaysMax,
      rating: p.rating,
      review_count: p.reviewCount,
      stock_status: stockStatusFromSupplierRegion(supplierRegion),
      metadata: metadata as ProductInsert["metadata"],
    };

    const { data, error } = await supabase
      .from("products")
      .upsert(record, { onConflict: "slug" })
      .select("slug")
      .single();

    if (!error && data?.slug) slugs.push(data.slug);
  }

  return slugs;
}

export async function deleteDiscoveredProductsBySlugs(slugs: string[]): Promise<void> {
  if (!isSupabaseConfigured() || !slugs.length) return;

  const supabase = createServiceClient();
  await supabase.from("products").delete().in("slug", slugs);
}
