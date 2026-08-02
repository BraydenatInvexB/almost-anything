import { calculateCustomerShipping } from "@/config/couriers";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";
import { resolveDeliveryFeeZar } from "@/lib/delivery/fees";
import type { DeliverySize } from "@/lib/delivery/size";

export interface StorefrontPricingSettings {
  freeShippingThreshold: number;
  flatShippingFee: number;
  taxRate: number;
  embedShippingInPrice: boolean;
  freeShippingEnabled: boolean;
  flatShippingFeeEnabled: boolean;
  defaultCourierId: string;
  currency: string;
  config?: ExtendedPlatformConfig;
}

export const DEFAULT_PRICING_SETTINGS: StorefrontPricingSettings = {
  freeShippingThreshold: 1000,
  flatShippingFee: 100,
  taxRate: 0.15,
  embedShippingInPrice: true,
  freeShippingEnabled: false,
  flatShippingFeeEnabled: true,
  defaultCourierId: "aramex",
  currency: "ZAR",
};

export function computeStorefrontTotals(
  subtotal: number,
  settings: StorefrontPricingSettings,
  courierId?: string,
  promoDiscount = 0,
  deliverySize?: DeliverySize | null,
) {
  const discountedSubtotal = Math.max(0, subtotal - promoDiscount);
  const cid = courierId ?? settings.defaultCourierId;
  const sizeBasedFee = resolveDeliveryFeeZar(
    deliverySize,
    settings.config?.deliveryFees ?? {
      standardZar: settings.flatShippingFee,
      largeItemZar: Math.max(settings.flatShippingFee, 200),
    },
  );
  const shippingCalc = calculateCustomerShipping(discountedSubtotal, cid, {
    freeShippingThreshold: settings.freeShippingThreshold,
    flatShippingFee: sizeBasedFee,
    embedShippingInPrice: settings.embedShippingInPrice,
    freeShippingEnabled: settings.freeShippingEnabled,
    flatShippingFeeEnabled: settings.flatShippingFeeEnabled,
    config: settings.config,
  });
  const shipping = shippingCalc.customerCharge;
  const tax = Math.round(discountedSubtotal * settings.taxRate * 100) / 100;
  const total = Math.round((discountedSubtotal + shipping + tax) * 100) / 100;
  return {
    shipping,
    tax,
    total,
    shippingCalc,
    promoDiscount,
    discountedSubtotal,
    deliveryFeeZar: sizeBasedFee,
  };
}
