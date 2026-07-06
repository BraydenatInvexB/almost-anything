export type SpecialPricing = {
  enabled: boolean;
  compareAtPrice: number | null;
  salePrice: number | null;
  discountPercent: number | null;
};

export function parseCompareAtPrice(metadata: unknown): number | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = (metadata as Record<string, unknown>).compare_at_price;
  const value = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function parseSpecialPricing(
  metadata: unknown,
  retailPrice: number,
  isDeal?: boolean,
): SpecialPricing {
  const compareAt = parseCompareAtPrice(metadata);
  const enabled = Boolean(isDeal && compareAt && compareAt > retailPrice);
  const discountPercent =
    enabled && compareAt
      ? Math.round((1 - retailPrice / compareAt) * 100)
      : null;

  return {
    enabled,
    compareAtPrice: enabled ? compareAt : null,
    salePrice: enabled ? retailPrice : null,
    discountPercent: discountPercent && discountPercent > 0 ? discountPercent : null,
  };
}

export function computeDealDiscountPercent(
  compareAt: number,
  salePrice: number,
): number | null {
  if (!Number.isFinite(compareAt) || !Number.isFinite(salePrice)) return null;
  if (compareAt <= salePrice) return null;
  return Math.round((1 - salePrice / compareAt) * 100);
}

export function resolveRetailWithSpecial(input: {
  basePrice: number;
  markupPercent: number;
  specialEnabled: boolean;
  salePriceInput?: number | null;
}): number {
  if (input.specialEnabled && input.salePriceInput != null && input.salePriceInput > 0) {
    return Number(input.salePriceInput.toFixed(2));
  }
  return Number((input.basePrice * (1 + input.markupPercent / 100)).toFixed(2));
}

export function specialPricingMetadata(
  compareAt: number | null,
): Record<string, unknown> {
  if (compareAt == null || compareAt <= 0) {
    return { compare_at_price: null };
  }
  return { compare_at_price: compareAt };
}
