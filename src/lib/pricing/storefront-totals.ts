import { calculateCustomerShipping } from "@/config/couriers";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";

export interface StorefrontPricingSettings {
  freeShippingThreshold: number;
  flatShippingFee: number;
  taxRate: number;
  embedShippingInPrice: boolean;
  defaultCourierId: string;
  currency: string;
  config?: ExtendedPlatformConfig;
}

export const DEFAULT_PRICING_SETTINGS: StorefrontPricingSettings = {
  freeShippingThreshold: 1000,
  flatShippingFee: 99,
  taxRate: 0.15,
  embedShippingInPrice: true,
  defaultCourierId: "aramex",
  currency: "ZAR",
};

export function computeStorefrontTotals(
  subtotal: number,
  settings: StorefrontPricingSettings,
  courierId?: string,
) {
  const cid = courierId ?? settings.defaultCourierId;
  const shippingCalc = calculateCustomerShipping(subtotal, cid, {
    freeShippingThreshold: settings.freeShippingThreshold,
    flatShippingFee: settings.flatShippingFee,
    embedShippingInPrice: settings.embedShippingInPrice,
    config: settings.config,
  });
  const shipping = shippingCalc.customerCharge;
  const tax = Math.round(subtotal * settings.taxRate * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  return { shipping, tax, total, shippingCalc };
}
