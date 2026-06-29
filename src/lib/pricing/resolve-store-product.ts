import type { Product, ProductCardData } from "@/types";
import { SITE_CONFIG } from "@/config/site";
import { getWarehouseBadgeLabel } from "@/config/product-stock";
import { getProductBySlugSeed } from "@/lib/data/seed-products";
import { stockFromMetadata } from "@/lib/catalog/product-stock-label";
import { parsePricingFromMetadata } from "@/lib/pricing/discovery-pricing";
import { parseProductEnrichment } from "@/types/product-enrichment";

/**
 * Supabase ingest historically defaulted currency to USD. Prefer seed pricing
 * for known slugs; otherwise force the storefront default (ZAR).
 */
export function resolveStoreProduct(product: Product): Product {
  if (product.currency === SITE_CONFIG.defaultCurrency) {
    return product;
  }

  const seed = getProductBySlugSeed(product.slug);
  if (seed) {
    return {
      ...seed,
      id: product.id,
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }

  return { ...product, currency: SITE_CONFIG.defaultCurrency };
}

export function resolveStoreProductCard(product: Product): ProductCardData {
  const resolved = resolveStoreProduct(product);
  const enrichment = parseProductEnrichment(resolved.metadata);
  const stock = stockFromMetadata(resolved.metadata);
  const pricing = parsePricingFromMetadata(resolved.metadata);
  const warehouseLabel = getWarehouseBadgeLabel(resolved.stock_status ?? "in_stock", resolved.metadata);
  const cardDescription = enrichment.summary || resolved.description || undefined;
  const unitPriceLabel =
    pricing.minimumOrderQuantity > 1
      ? `per ${pricing.unitLabel} · min ${pricing.minimumOrderQuantity}`
      : undefined;

  return {
    id: resolved.id,
    slug: resolved.slug,
    name: resolved.name,
    description: cardDescription,
    price: resolved.retail_price,
    currency: resolved.currency,
    rating: resolved.rating,
    imageUrl: resolved.enhanced_image_url ?? resolved.image_url ?? "",
    category: resolved.category,
    isDeal: resolved.is_deal,
    dealLabel: resolved.deal_discount_percent
      ? `${resolved.deal_discount_percent}% off`
      : undefined,
    dealDiscountPercent: resolved.deal_discount_percent ?? undefined,
    isExclusive: resolved.is_exclusive,
    stockLabel: warehouseLabel,
    warehouseLabel,
    quantity: stock?.quantity,
    unitPriceLabel,
    minimumOrderQuantity: pricing.minimumOrderQuantity,
  };
}
