import "server-only";

import { getActiveCouriers } from "@/config/couriers";
import { buildSellerShippingContext } from "@/lib/shipping/platform-shipping";
import {
  getPublicStorefrontConfig,
  getPublicStorefrontSettings,
} from "@/services/storefront-settings-service";
import type { SellerShippingContext } from "@/lib/seller/product-pricing";

export type SellerPlatformCourier = {
  id: string;
  name: string;
  etaLabel: string;
  regions: string[];
};

export type SellerPlatformContext = {
  shipping: SellerShippingContext;
  couriers: SellerPlatformCourier[];
};

export async function getSellerPlatformContext(): Promise<SellerPlatformContext> {
  const [settings, config] = await Promise.all([
    getPublicStorefrontSettings(),
    getPublicStorefrontConfig(),
  ]);

  return {
    shipping: buildSellerShippingContext(settings, config),
    couriers: getActiveCouriers(config).map((c) => ({
      id: c.id,
      name: c.name,
      etaLabel: c.etaLabel,
      regions: c.regions,
    })),
  };
}
