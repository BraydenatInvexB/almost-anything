import { buildProductMetadata, parseProductEnrichment } from "@/types/product-enrichment";
import type { ProductEnrichment } from "@/types/product-enrichment";
import {
  emptyVariantsConfig,
  parseVariantsConfigForEditor,
  type ProductVariantsConfig,
} from "@/types/product-variants";
import {
  computeDealDiscountPercent,
  parseCompareAtPrice,
  resolveRetailWithSpecial,
  specialPricingMetadata,
} from "@/lib/product/product-special-pricing";
import { sellerDeliveryMetadata, type SellerDeliverySettings } from "@/lib/seller/product-pricing";
import {
  applySellerSupplierMetadata,
  type SellerSupplierInfo,
} from "@/lib/seller/product-supplier";
import { parseStockOrigin } from "@/lib/product/stock-origin";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";
import type { Json } from "@/types/database";
import {
  deliverySizeMetadata,
  parseDeliverySize,
  type DeliverySize,
} from "@/lib/delivery/size";

export type SellerSpecialPricingInput = {
  enabled: boolean;
  compareAtPrice?: number | null;
  salePrice?: number | null;
};

export type SellerProductCatalogExtras = {
  variants: ProductVariantsConfig;
  enrichment: ProductEnrichment;
  special: SellerSpecialPricingInput;
};

export function parseSellerProductCatalogExtras(
  metadata: unknown,
  retailPrice: number,
  isDeal?: boolean,
): SellerProductCatalogExtras {
  const compareAt = parseCompareAtPrice(metadata);
  const enabled = Boolean(isDeal && compareAt && compareAt > retailPrice);
  return {
    variants: parseVariantsConfigForEditor(metadata),
    enrichment: parseProductEnrichment(metadata),
    special: {
      enabled,
      compareAtPrice: enabled ? compareAt : null,
      salePrice: enabled ? retailPrice : null,
    },
  };
}

export function resolveSellerRetailPrice(input: {
  costPrice: number;
  markupPercent: number;
  retailPrice?: number;
  special?: SellerSpecialPricingInput | null;
}): number {
  return resolveRetailWithSpecial({
    basePrice: input.costPrice,
    markupPercent: input.markupPercent,
    specialEnabled: Boolean(input.special?.enabled),
    salePriceInput: input.special?.salePrice ?? null,
  });
}

export function resolveSellerDealFields(special?: SellerSpecialPricingInput | null): {
  isDeal: boolean;
  dealDiscountPercent: number | null;
  compareAt: number | null;
} {
  if (!special?.enabled) {
    return { isDeal: false, dealDiscountPercent: null, compareAt: null };
  }
  const compareAt =
    special.compareAtPrice != null && special.compareAtPrice > 0 ? special.compareAtPrice : null;
  const sale =
    special.salePrice != null && special.salePrice > 0 ? special.salePrice : null;
  return {
    isDeal: Boolean(compareAt && sale && compareAt > sale),
    dealDiscountPercent:
      compareAt && sale ? computeDealDiscountPercent(compareAt, sale) : null,
    compareAt,
  };
}

/**
 * Build seller product metadata: keep private seller fields, plus storefront
 * enrichment/variants/special pricing in the same shape admin uses.
 */
export function buildSellerProductMetadata(input: {
  existingMeta?: Record<string, unknown>;
  imageUrls: string[];
  stockOrigin: StockOrigin;
  delivery: SellerDeliverySettings;
  deliverySize?: DeliverySize;
  supplier?: SellerSupplierInfo | null;
  variants?: ProductVariantsConfig | null;
  enrichment?: ProductEnrichment | null;
  special?: SellerSpecialPricingInput | null;
}): Json {
  const stockOrigin = parseStockOrigin(input.stockOrigin);
  const deal = resolveSellerDealFields(input.special);
  const enrichment = input.enrichment ?? { highlights: [], specifications: {} };
  const variants =
    input.variants && input.variants.options.length > 0 ? input.variants : null;
  const deliverySize = parseDeliverySize(input.deliverySize);

  const storefrontMeta = buildProductMetadata({
    variants,
    highlights: enrichment.highlights,
    specifications: enrichment.specifications,
    summary: enrichment.summary,
  });

  // Clear enrichment keys when emptied so storefront does not keep stale copy.
  const cleared: Record<string, unknown> = {
    ...(input.existingMeta ?? {}),
    ...storefrontMeta,
    gallery: input.imageUrls,
    sellerListing: true,
    stock_origin: stockOrigin,
    ...sellerDeliveryMetadata(input.delivery),
    ...deliverySizeMetadata(deliverySize),
    ...specialPricingMetadata(deal.compareAt),
  };

  if (!enrichment.highlights?.length) delete cleared.highlights;
  if (!enrichment.specifications || !Object.keys(enrichment.specifications).length) {
    delete cleared.specifications;
  }
  if (!enrichment.summary?.trim()) delete cleared.summary;
  if (!variants) delete cleared.variants;
  if (!deal.compareAt) delete cleared.compare_at_price;

  return applySellerSupplierMetadata(cleared, input.supplier) as Json;
}

export function emptySellerVariants(): ProductVariantsConfig {
  return emptyVariantsConfig();
}
