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
  return {
    flatShippingFee: Number(settings.flat_shipping_fee),
    freeShippingThreshold: Number(settings.free_shipping_threshold),
    defaultMarkupPercent: Number(settings.default_markup_percent),
    ...flags,
  };
}

export function describePlatformShipping(
  shipping: Pick<
    SellerShippingContext,
    "flatShippingFee" | "freeShippingThreshold" | "freeShippingEnabled" | "flatShippingFeeEnabled"
  >,
): string {
  if (!shipping.flatShippingFeeEnabled && !shipping.freeShippingEnabled) {
    return "Delivery fees are configured per product.";
  }
  if (shipping.freeShippingEnabled && shipping.flatShippingFeeEnabled) {
    return `Default delivery fee ${formatZar(shipping.flatShippingFee)} (free over ${formatZar(shipping.freeShippingThreshold)}).`;
  }
  if (shipping.flatShippingFeeEnabled) {
    return `Default delivery fee ${formatZar(shipping.flatShippingFee)} on checkout.`;
  }
  return `Free delivery on orders over ${formatZar(shipping.freeShippingThreshold)}.`;
}

function formatZar(value: number) {
  return `R${value.toFixed(2)}`;
}
