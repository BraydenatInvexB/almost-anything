import type { PromoCode } from "@/lib/admin/operations-promo-types";
import { normalizePromoCodeValue } from "@/lib/admin/operations-store-promos";

export interface PromoCartItem {
  productId?: string;
  slug?: string;
  price: number;
  quantity: number;
}

export interface PromoDiscountResult {
  valid: boolean;
  message?: string;
  code?: string;
  promoId?: string;
  discountAmount: number;
  eligibleSubtotal: number;
  cartSubtotal: number;
  discountedSubtotal: number;
}

export function isPromoActive(promo: PromoCode, now = new Date()): boolean {
  if (promo.status !== "active") return false;
  if (promo.startsAt && new Date(promo.startsAt) > now) return false;
  if (promo.endsAt && new Date(promo.endsAt) < now) return false;
  if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) return false;
  return true;
}

function resolveItemCategory(
  item: PromoCartItem,
  categoryByKey: Map<string, string>,
): string | undefined {
  if (item.productId && categoryByKey.has(item.productId)) {
    return categoryByKey.get(item.productId);
  }
  if (item.slug && categoryByKey.has(item.slug)) {
    return categoryByKey.get(item.slug);
  }
  return undefined;
}

function itemMatchesScope(
  item: PromoCartItem,
  promo: PromoCode,
  categoryByKey: Map<string, string>,
): boolean {
  if (promo.scope === "all") return true;
  if (promo.scope === "products") {
    const keys = [item.productId, item.slug].filter(Boolean) as string[];
    return keys.some((key) => promo.productIds.includes(key));
  }
  const category = resolveItemCategory(item, categoryByKey);
  return category ? promo.categorySlugs.includes(category as PromoCode["categorySlugs"][number]) : false;
}

export function calculatePromoDiscount(
  items: PromoCartItem[],
  promo: PromoCode,
  categoryByKey: Map<string, string>,
): PromoDiscountResult {
  const cartSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const empty = {
    discountAmount: 0,
    eligibleSubtotal: 0,
    cartSubtotal,
    discountedSubtotal: cartSubtotal,
  };

  if (!isPromoActive(promo)) {
    return { valid: false, message: "This promo code is not active", ...empty };
  }

  if (promo.minOrderAmount != null && cartSubtotal < promo.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order of R${promo.minOrderAmount.toFixed(0)} required`,
      ...empty,
    };
  }

  const eligibleSubtotal = items
    .filter((item) => itemMatchesScope(item, promo, categoryByKey))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (eligibleSubtotal <= 0) {
    return {
      valid: false,
      message: "No items in your cart qualify for this code",
      ...empty,
    };
  }

  let discountAmount =
    promo.discountType === "percent"
      ? eligibleSubtotal * (promo.discountValue / 100)
      : Math.min(promo.discountValue, eligibleSubtotal);

  if (promo.discountType === "percent" && promo.maxDiscountAmount != null) {
    discountAmount = Math.min(discountAmount, promo.maxDiscountAmount);
  }

  discountAmount = Math.round(Math.min(discountAmount, cartSubtotal) * 100) / 100;

  return {
    valid: true,
    code: promo.code,
    promoId: promo.id,
    discountAmount,
    eligibleSubtotal,
    cartSubtotal,
    discountedSubtotal: Math.max(0, cartSubtotal - discountAmount),
  };
}

export function findPromoByCode(codes: PromoCode[], rawCode: string): PromoCode | null {
  const normalized = normalizePromoCodeValue(rawCode);
  return codes.find((p) => p.code === normalized) ?? null;
}
