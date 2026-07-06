import type { CartItem, CheckoutPayload } from "@/types/cart";
import { calculatePromoDiscount, findPromoByCode } from "@/lib/promo/apply-promo";
import { buildProductCategoryMap } from "@/lib/promo/resolve-product-categories";
import {
  getPromoByCode,
  incrementPromoUsage,
  listPromoCodes,
} from "@/lib/admin/operations-persistence";

export function cartItemsToPromoItems(items: CartItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    slug: item.slug,
    price: item.price,
    quantity: item.quantity,
  }));
}

export async function validateCheckoutPromo(code: string, items: CartItem[]) {
  const promoItems = cartItemsToPromoItems(items);
  const promos = await listPromoCodes();
  const promo = findPromoByCode(promos, code) ?? (await getPromoByCode(code));
  if (!promo) {
    return {
      valid: false as const,
      message: "Promo code not found",
      discountAmount: 0,
    };
  }

  const categoryByKey = await buildProductCategoryMap();
  const result = calculatePromoDiscount(promoItems, promo, categoryByKey);
  return { ...result, promo };
}

export async function resolveOrderPromo(payload: CheckoutPayload) {
  if (!payload.promoCode?.trim()) {
    return { promoDiscount: 0, promoCode: undefined as string | undefined };
  }

  const promoResult = await applyCheckoutPromo(payload.promoCode, payload.items);
  return {
    promoDiscount: promoResult.discountAmount,
    promoCode: promoResult.code,
  };
}

export async function applyCheckoutPromo(code: string, items: CartItem[]) {
  const result = await validateCheckoutPromo(code, items);
  if (!result.valid || !result.promoId) {
    throw new Error(result.message ?? "Invalid promo code");
  }
  await incrementPromoUsage(result.promoId);
  return result;
}
