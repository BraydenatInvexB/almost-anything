import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  DeliveryCollectionItem,
  DeliveryCollectionStop,
} from "@/lib/delivery/types";

type ServiceClient = SupabaseClient<Database>;

type OrderItemRow = {
  order_id: string;
  seller_id: string | null;
  name: string;
  quantity: number;
};

type SellerRow = {
  id: string;
  shop_name: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  business_address: unknown;
};

type TeamRow = {
  seller_id: string;
  full_name: string;
  role: string;
  status: string;
};

/**
 * Builds the collection route from the stores that own each order line.
 * This also hydrates delivery jobs created before collection stops were
 * snapshotted into delivery_jobs.metadata.
 */
export async function resolveCollectionStopsForOrders(
  supabase: ServiceClient,
  orderIds: string[],
): Promise<Map<string, DeliveryCollectionStop[]>> {
  const uniqueOrderIds = [...new Set(orderIds.filter(Boolean))];
  const result = new Map<string, DeliveryCollectionStop[]>();
  if (!uniqueOrderIds.length) return result;

  const { data: rawItems } = await supabase
    .from("order_items")
    .select("order_id,seller_id,name,quantity")
    .in("order_id", uniqueOrderIds);
  const items = (rawItems ?? []) as OrderItemRow[];
  const sellerIds = [...new Set(items.map((item) => item.seller_id).filter(Boolean))] as string[];

  const [sellerResult, teamResult] = await Promise.all([
    sellerIds.length
      ? supabase
          .from("sellers")
          .select("id,shop_name,company_name,contact_email,contact_phone,business_address")
          .in("id", sellerIds)
      : Promise.resolve({ data: [] as SellerRow[] }),
    sellerIds.length
      ? supabase
          .from("seller_team_members")
          .select("seller_id,full_name,role,status")
          .in("seller_id", sellerIds)
          .eq("status", "active")
      : Promise.resolve({ data: [] as TeamRow[] }),
  ]);

  const sellers = (sellerResult.data ?? []) as SellerRow[];
  const team = (teamResult.data ?? []) as TeamRow[];
  const sellerById = new Map(sellers.map((seller) => [seller.id, seller]));
  const primaryContactBySeller = new Map<string, string>();
  for (const member of team) {
    if (!primaryContactBySeller.has(member.seller_id) || member.role === "owner") {
      primaryContactBySeller.set(member.seller_id, member.full_name);
    }
  }

  for (const orderId of uniqueOrderIds) {
    const orderItems = items.filter((item) => item.order_id === orderId);
    const orderedSources: Array<string | null> = [];
    for (const item of orderItems) {
      if (!orderedSources.includes(item.seller_id)) orderedSources.push(item.seller_id);
    }

    const stops = orderedSources.map((sellerId, index) => {
      const stopItems: DeliveryCollectionItem[] = orderItems
        .filter((item) => item.seller_id === sellerId)
        .map((item) => ({ name: item.name, quantity: Number(item.quantity) || 1 }));
      if (!sellerId) {
        return {
          id: `platform-${orderId}-${index}`,
          sellerId: null,
          kind: "platform" as const,
          shopName: "Almost Anything fulfilment",
          contactName: "Almost Anything operations",
          contactPhone: null,
          contactEmail: "help@almostanything.co.za",
          addressLine1: null,
          addressLine2: null,
          city: null,
          province: null,
          postalCode: null,
          country: "ZA",
          items: stopItems,
        };
      }

      const seller = sellerById.get(sellerId);
      const address = toAddressRecord(seller?.business_address);
      return {
        id: `seller-${sellerId}`,
        sellerId,
        kind: "seller" as const,
        shopName: seller?.shop_name || seller?.company_name || "Store collection",
        contactName:
          primaryContactBySeller.get(sellerId) || seller?.company_name || seller?.shop_name || null,
        contactPhone: seller?.contact_phone || null,
        contactEmail: seller?.contact_email || null,
        addressLine1: address.line1,
        addressLine2: address.line2,
        city: address.city,
        province: address.province,
        postalCode: address.postalCode,
        country: address.country,
        items: stopItems,
      };
    });
    result.set(orderId, stops);
  }

  return result;
}

function toAddressRecord(value: unknown) {
  const address = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    line1: stringOrNull(address.line1 ?? address.addressLine1 ?? address.address_line1),
    line2: stringOrNull(address.line2 ?? address.addressLine2 ?? address.address_line2),
    city: stringOrNull(address.city),
    province: stringOrNull(address.state ?? address.province),
    postalCode: stringOrNull(address.postalCode ?? address.postal_code),
    country: stringOrNull(address.country) ?? "ZA",
  };
}

function stringOrNull(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}
