import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { CheckoutPayload } from "@/types/cart";
import { normalizeProvince } from "@/config/provinces";
import {
  resolveDeliveryMode,
  type DeliveryFulfillmentMode,
  type DeliveryJobStatus,
  type DeliveryRoutingPolicy,
} from "@/lib/delivery/types";
import {
  parseDeliverySizeFromMetadata,
  summarizeOrderDeliverySize,
  type DeliverySize,
} from "@/lib/delivery/size";

type ServiceClient = SupabaseClient<Database>;

export async function resolveProductSellerIds(
  supabase: ServiceClient,
  productIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const ids = [...new Set(productIds.filter(Boolean))];
  if (!ids.length) return map;

  const { data } = await supabase.from("products").select("id, seller_id").in("id", ids);
  for (const row of data ?? []) {
    map.set(String(row.id), row.seller_id ? String(row.seller_id) : null);
  }
  return map;
}

export async function resolveProductDeliverySizes(
  supabase: ServiceClient,
  productIds: string[],
): Promise<Map<string, DeliverySize>> {
  const map = new Map<string, DeliverySize>();
  const ids = [...new Set(productIds.filter(Boolean))];
  if (!ids.length) return map;

  const { data } = await supabase.from("products").select("id, metadata").in("id", ids);
  for (const row of data ?? []) {
    map.set(String(row.id), parseDeliverySizeFromMetadata(row.metadata));
  }
  return map;
}

function initialStatus(mode: DeliveryFulfillmentMode): DeliveryJobStatus {
  if (mode === "seller_self") return "awaiting_seller";
  if (mode === "platform_driver") return "ready_for_driver";
  return "pending";
}

/**
 * Create the delivery job for a paid/sourcing checkout order based on
 * single-store vs multi-store routing policy.
 */
export async function createDeliveryJobForOrder(
  supabase: ServiceClient,
  input: {
    orderId: string;
    orderNumber: string;
    payload: CheckoutPayload;
    sellerIdsByProduct: Map<string, string | null>;
    policy: DeliveryRoutingPolicy;
    deliverySizesByProduct?: Map<string, DeliverySize>;
  },
): Promise<{ mode: DeliveryFulfillmentMode; jobId: string | null }> {
  const sellerIds = new Set<string>();
  const itemSizes: DeliverySize[] = [];

  for (const item of input.payload.items) {
    if (!item.productId) continue;
    const sellerId = input.sellerIdsByProduct.get(item.productId);
    if (sellerId) sellerIds.add(sellerId);
    const size = input.deliverySizesByProduct?.get(item.productId);
    if (size) itemSizes.push(size);
  }

  const sizeSummary = summarizeOrderDeliverySize(itemSizes);
  const mode = resolveDeliveryMode(sellerIds.size, input.policy);
  const addr = input.payload.shippingAddress;
  const province = normalizeProvince(addr.state);
  const itemSummary = input.payload.items
    .map((i) => `${i.quantity}× ${i.name}`)
    .slice(0, 6)
    .join(", ");
  const itemCount = input.payload.items.reduce((n, i) => n + i.quantity, 0);

  const singleSellerId = sellerIds.size === 1 ? [...sellerIds][0]! : null;

  const row = {
    order_id: input.orderId,
    order_number: input.orderNumber,
    mode,
    status: initialStatus(mode),
    seller_id: mode === "seller_self" ? singleSellerId : null,
    driver_id: null as string | null,
    province: province || null,
    customer_name: addr.fullName,
    customer_phone: addr.phone,
    customer_email: addr.email,
    address_line1: addr.addressLine1,
    address_line2: addr.addressLine2 ?? null,
    city: addr.city,
    postal_code: addr.postalCode,
    country: addr.country || "ZA",
    item_summary: itemSummary,
    item_count: itemCount,
    metadata: {
      uniqueSellerCount: sellerIds.size,
      sellerIds: [...sellerIds],
      courierId: input.payload.courierId ?? null,
      courierName: input.payload.courierName ?? null,
      deliverySize: sizeSummary.size,
      deliverySizeLabel: sizeSummary.label,
      vehicleHint: sizeSummary.vehicleHint,
      mayNeedTwoPeople: sizeSummary.mayNeedTwoPeople,
      itemSizes,
    } as Json,
  };

  const { data, error } = await supabase
    .from("delivery_jobs")
    .insert(row)
    .select("id")
    .single();

  if (error) {
    console.error("[delivery] create job failed", error.message);
    return { mode, jobId: null };
  }

  return { mode, jobId: data?.id ?? null };
}
