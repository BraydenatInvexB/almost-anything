/** Delivery fulfillment modes and admin-configurable routing policy. */

export type DriverStatus = "pending" | "active" | "suspended" | "rejected";

export interface DriverProfile {
  id: string;
  userId: string | null;
  email: string;
  fullName: string;
  phone: string | null;
  province: string;
  status: DriverStatus;
  vehicleNotes: string | null;
  verificationStatus: "incomplete" | "pending" | "approved" | "rejected";
}

export type DeliveryFulfillmentMode = "seller_self" | "platform_driver" | "courier_partner";

export type DeliveryJobStatus =
  | "pending"
  | "awaiting_seller"
  | "ready_for_driver"
  | "assigned"
  | "collecting"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export interface DeliveryRoutingPolicy {
  /**
   * When the cart is from a single store:
   * - seller_self: shop owner delivers (default)
   * - platform_driver: Almost Anything drivers
   * - courier_partner: existing courier partners
   */
  singleStoreMode: DeliveryFulfillmentMode;
  /**
   * When the cart spans multiple stores:
   * - platform_driver: Almost Anything collects & delivers (default)
   * - courier_partner: courier partners
   * - seller_self: each shop delivers their own lines (advanced)
   */
  multiStoreMode: DeliveryFulfillmentMode;
}

export const DEFAULT_DELIVERY_ROUTING: DeliveryRoutingPolicy = {
  singleStoreMode: "seller_self",
  multiStoreMode: "platform_driver",
};

export function mergeDeliveryRouting(
  partial?: Partial<DeliveryRoutingPolicy> | null,
): DeliveryRoutingPolicy {
  return {
    singleStoreMode: partial?.singleStoreMode ?? DEFAULT_DELIVERY_ROUTING.singleStoreMode,
    multiStoreMode: partial?.multiStoreMode ?? DEFAULT_DELIVERY_ROUTING.multiStoreMode,
  };
}

export function resolveDeliveryMode(
  uniqueSellerCount: number,
  policy: DeliveryRoutingPolicy,
): DeliveryFulfillmentMode {
  if (uniqueSellerCount <= 1) return policy.singleStoreMode;
  return policy.multiStoreMode;
}

export const DELIVERY_MODE_LABELS: Record<DeliveryFulfillmentMode, string> = {
  seller_self: "Store delivers",
  platform_driver: "Almost Anything drivers",
  courier_partner: "Courier partners",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryJobStatus, string> = {
  pending: "Pending",
  awaiting_seller: "Waiting on store",
  ready_for_driver: "Ready for driver",
  assigned: "Driver assigned",
  collecting: "Collecting",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
