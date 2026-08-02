import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";
import type { SellerShippingContext } from "@/lib/seller/product-pricing";
import type { PlatformSettings } from "@/types/database";

export function shippingFlagsFromConfig(config: ExtendedPlatformConfig) {
  return {
    freeShippingEnabled: config.freeShippingEnabled ?? false,
    flatShippingFeeEnabled: config.flatShippingFeeEnabled ?? true,
  };
}

export function buildSellerShippingContext(
  settings: PlatformSettings,
  config: ExtendedPlatformConfig,
): SellerShippingContext {
  const flags = shippingFlagsFromConfig(config);
  const standardFee = Number(config.deliveryFees?.standardZar ?? settings.flat_shipping_fee);
  return {
    flatShippingFee: standardFee,
    largeItemShippingFee: Number(config.deliveryFees?.largeItemZar ?? 200),
    freeShippingThreshold: Number(settings.free_shipping_threshold),
    defaultMarkupPercent: Number(settings.default_markup_percent),
    ...flags,
  };
}

export function describePlatformShipping(
  shipping: Pick<
    SellerShippingContext,
    | "flatShippingFee"
    | "largeItemShippingFee"
    | "freeShippingThreshold"
    | "freeShippingEnabled"
    | "flatShippingFeeEnabled"
  >,
): string {
  if (!shipping.flatShippingFeeEnabled && !shipping.freeShippingEnabled) {
    return "Delivery fees are configured per product.";
  }
  const large = shipping.largeItemShippingFee ?? Math.max(shipping.flatShippingFee, 200);
  if (shipping.freeShippingEnabled && shipping.flatShippingFeeEnabled) {
    return `Normal delivery ${formatZar(shipping.flatShippingFee)}, large items ${formatZar(large)} (free over ${formatZar(shipping.freeShippingThreshold)}).`;
  }
  if (shipping.flatShippingFeeEnabled) {
    return `Normal delivery ${formatZar(shipping.flatShippingFee)}, large / bulky items ${formatZar(large)}.`;
  }
  return `Free delivery on orders over ${formatZar(shipping.freeShippingThreshold)}.`;
}

function formatZar(value: number) {
  return `R${value.toFixed(2)}`;
}
