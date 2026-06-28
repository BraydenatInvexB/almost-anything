import { NextResponse } from "next/server";
import { getSettings, getPlatformExtendedConfig } from "@/services/admin-service";
import { getActiveCouriers } from "@/config/couriers";

export async function GET() {
  const settings = await getSettings();
  const config = await getPlatformExtendedConfig();
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
