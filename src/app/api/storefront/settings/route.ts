import { NextResponse } from "next/server";
import { getActiveCouriers } from "@/config/couriers";
import {
  getPublicStorefrontConfig,
  getPublicStorefrontSettings,
} from "@/services/storefront-settings-service";

export async function GET() {
  const settings = await getPublicStorefrontSettings();
  const config = await getPublicStorefrontConfig();
  const couriers = getActiveCouriers(config);

  return NextResponse.json({
    currency: settings.currency,
    freeShippingThreshold: settings.free_shipping_threshold,
    flatShippingFee: settings.flat_shipping_fee,
    taxRate: settings.tax_rate,
    embedShippingInPrice: config.embedShippingInPrice,
    defaultCourierId: config.defaultCourierId,
    couriers: couriers.map((c) => ({ id: c.id, name: c.name, etaLabel: c.etaLabel })),
    config,
  });
}
