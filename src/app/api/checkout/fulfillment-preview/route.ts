import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  resolveProductDeliverySizes,
  resolveProductSellerIds,
} from "@/lib/delivery/create-job";
import {
  DELIVERY_MODE_LABELS,
  mergeDeliveryRouting,
  resolveDeliveryMode,
} from "@/lib/delivery/types";
import {
  DEFAULT_DELIVERY_SIZE,
  summarizeOrderDeliverySize,
  type DeliverySize,
} from "@/lib/delivery/size";
import { resolveDeliveryFeeZar } from "@/lib/delivery/fees";
import { getPublicStorefrontConfig } from "@/services/storefront-settings-service";

const schema = z.object({
  productIds: z.array(z.string()).max(100),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const config = await getPublicStorefrontConfig();
  const policy = mergeDeliveryRouting(config.deliveryRouting);

  let uniqueSellerCount = 0;
  const sizes: DeliverySize[] = [];

  if (isSupabaseConfigured() && parsed.data.productIds.length > 0) {
    const supabase = createServiceClient();
    const [sellerMap, sizeMap] = await Promise.all([
      resolveProductSellerIds(supabase, parsed.data.productIds),
      resolveProductDeliverySizes(supabase, parsed.data.productIds),
    ]);
    const sellers = new Set<string>();
    for (const id of parsed.data.productIds) {
      const sellerId = sellerMap.get(id);
      if (sellerId) sellers.add(sellerId);
      sizes.push(sizeMap.get(id) ?? DEFAULT_DELIVERY_SIZE);
    }
    uniqueSellerCount = sellers.size;
  }

  const mode = resolveDeliveryMode(uniqueSellerCount || 1, policy);
  const deliverySize = summarizeOrderDeliverySize(sizes);
  const deliveryFeeZar = resolveDeliveryFeeZar(deliverySize.size, config.deliveryFees);

  return NextResponse.json({
    mode,
    modeLabel: DELIVERY_MODE_LABELS[mode],
    uniqueSellerCount,
    showCourierPicker: mode === "courier_partner",
    policy,
    deliverySize,
    deliveryFeeZar,
  });
}
