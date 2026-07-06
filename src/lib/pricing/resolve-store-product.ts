import type { Product, ProductCardData } from "@/types";
import { SITE_CONFIG } from "@/config/site";
import { getWarehouseBadgeLabel } from "@/config/product-stock";
import { resolveProductDeliveryDays } from "@/config/delivery";
import { getProductBySlugSeed } from "@/lib/data/seed-products";
import { parseProductGallery } from "@/lib/product/product-gallery";
import {
  parseCompareAtPrice,
  parseSpecialPricing,
} from "@/lib/product/product-special-pricing";
import { stockFromMetadata } from "@/lib/catalog/product-stock-label";
import { parsePricingFromMetadata } from "@/lib/pricing/discovery-pricing";
import { customerFacingDescription, parseProductEnrichment } from "@/types/product-enrichment";

function isDiscoveredListing(metadata: Product["metadata"]): boolean {
  const sourcing = metadata as { sourcing?: { query?: string } } | null;
  return Boolean(sourcing?.sourcing?.query);
}

/** Discovered listings have no verified customer reviews yet; hide fabricated defaults. */
function publicReviewFields(product: Product): { rating: number; review_count: number } {
  if (isDiscoveredListing(product.metadata)) {
    return { rating: 0, review_count: 0 };
  }
  return {
    rating: product.review_count > 0 ? product.rating : 0,
    review_count: product.review_count,
  };
}

/**
 * Supabase ingest historically defaulted currency to USD. Prefer seed pricing
 * for known slugs; otherwise force the storefront default (ZAR).
 */
export function resolveStoreProduct(product: Product): Product {
  let resolved: Product;

  if (product.currency === SITE_CONFIG.defaultCurrency) {
    resolved = product;
  } else {
    const seed = getProductBySlugSeed(product.slug);
    if (seed) {
      resolved = {
        ...seed,
        id: product.id,
        created_at: product.created_at,
        updated_at: product.updated_at,
      };
    } else {
      resolved = { ...product, currency: SITE_CONFIG.defaultCurrency };
    }
  }

  const delivery = resolveProductDeliveryDays({
    stock_status: resolved.stock_status,
    metadata: resolved.metadata,
  });

  const reviews = publicReviewFields(resolved);

  return {
    ...resolved,
    delivery_days_min: delivery.min,
    delivery_days_max: delivery.max,
    rating: reviews.rating,
    review_count: reviews.review_count,
  };
}

export function resolveStoreProductCard(product: Product): ProductCardData {
  const resolved = resolveStoreProduct(product);
  const enrichment = parseProductEnrichment(resolved.metadata);
  const stock = stockFromMetadata(resolved.metadata);
  const pricing = parsePricingFromMetadata(resolved.metadata);
  const warehouseLabel = getWarehouseBadgeLabel(resolved.stock_status ?? "in_stock", resolved.metadata);
  const cardDescription =
    customerFacingDescription(enrichment.summary) ||
    customerFacingDescription(resolved.description) ||
    undefined;
  const unitPriceLabel =
    pricing.minimumOrderQuantity > 1
      ? `per ${pricing.unitLabel} · min ${pricing.minimumOrderQuantity}`
      : undefined;
  const gallery = parseProductGallery(
    resolved.metadata,
    resolved.enhanced_image_url ?? resolved.image_url,
  );
  const special = parseSpecialPricing(
    resolved.metadata,
    resolved.retail_price,
    resolved.is_deal,
  );

  return {
    id: resolved.id,
    slug: resolved.slug,
    name: resolved.name,
    description: cardDescription,
    price: resolved.retail_price,
    currency: resolved.currency,
    rating: resolved.rating,
    reviewCount: resolved.review_count,
    imageUrl: gallery[0] ?? "",
    category: resolved.category,
    isDeal: special.enabled || resolved.is_deal,
    dealLabel: special.discountPercent
      ? `${special.discountPercent}% off`
      : resolved.deal_discount_percent
        ? `${resolved.deal_discount_percent}% off`
        : special.enabled
          ? "Special"
          : undefined,
    dealDiscountPercent:
      special.discountPercent ?? resolved.deal_discount_percent ?? undefined,
    compareAtPrice: special.compareAtPrice ?? parseCompareAtPrice(resolved.metadata),
    isExclusive: resolved.is_exclusive,
    stockLabel: warehouseLabel,
    warehouseLabel,
    quantity: stock?.quantity,
    unitPriceLabel,
    minimumOrderQuantity: pricing.minimumOrderQuantity,
  };
}
