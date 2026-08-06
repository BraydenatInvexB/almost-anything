import { COURIERS } from "@/config/couriers";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";
import { DEFAULT_HERO_SHOWCASE, mergeHeroShowcase } from "@/lib/hero/defaults";
import { DEFAULT_DELIVERY_ROUTING, mergeDeliveryRouting } from "@/lib/delivery/types";
import { DEFAULT_DELIVERY_FEES, mergeDeliveryFees } from "@/lib/delivery/fees";

export const DEFAULT_EXTENDED_CONFIG: ExtendedPlatformConfig = {
  embedShippingInPrice: false,
  freeShippingEnabled: false,
  flatShippingFeeEnabled: true,
  defaultCourierId: "almost_anything",
  enabledCourierIds: ["almost_anything"],
  currency: "ZAR",
  couriers: COURIERS.map((c) => ({ ...c })),
  heroShowcase: DEFAULT_HERO_SHOWCASE,
  deliveryRouting: { ...DEFAULT_DELIVERY_ROUTING },
  deliveryFees: { ...DEFAULT_DELIVERY_FEES },
  liveSourcingEnabled: false,
  driverPortalEnabled: true,
};

export function mergeExtendedConfig(
  partial: Partial<ExtendedPlatformConfig> | Record<string, unknown> | null | undefined,
): ExtendedPlatformConfig {
  if (!partial || typeof partial !== "object") return structuredClone(DEFAULT_EXTENDED_CONFIG);
  const routingPartial =
    partial.deliveryRouting && typeof partial.deliveryRouting === "object"
      ? (partial.deliveryRouting as Partial<ExtendedPlatformConfig["deliveryRouting"]>)
      : null;
  const feesPartial =
    partial.deliveryFees && typeof partial.deliveryFees === "object"
      ? (partial.deliveryFees as Partial<ExtendedPlatformConfig["deliveryFees"]>)
      : null;
  return {
    ...DEFAULT_EXTENDED_CONFIG,
    ...partial,
    defaultCourierId: DEFAULT_EXTENDED_CONFIG.defaultCourierId,
    couriers: DEFAULT_EXTENDED_CONFIG.couriers,
    enabledCourierIds: DEFAULT_EXTENDED_CONFIG.enabledCourierIds,
    heroShowcase: mergeHeroShowcase(
      partial.heroShowcase as Partial<ExtendedPlatformConfig["heroShowcase"]> | undefined,
    ),
    deliveryRouting: mergeDeliveryRouting(routingPartial),
    deliveryFees: mergeDeliveryFees(feesPartial),
    liveSourcingEnabled: Boolean(
      partial.liveSourcingEnabled ?? DEFAULT_EXTENDED_CONFIG.liveSourcingEnabled,
    ),
    driverPortalEnabled: Boolean(
      partial.driverPortalEnabled ?? DEFAULT_EXTENDED_CONFIG.driverPortalEnabled,
    ),
  };
}
