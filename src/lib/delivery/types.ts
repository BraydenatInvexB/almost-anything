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

export interface DeliveryCollectionItem {
  name: string;
  quantity: number;
}

export interface DeliveryCollectionStop {
  id: string;
  sellerId: string | null;
  kind: "seller" | "platform";
  shopName: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
  items: DeliveryCollectionItem[];
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
   * Almost Anything handles delivery for every order.
   */
  singleStoreMode: DeliveryFulfillmentMode;
  /**
   * When the cart spans multiple stores:
   * Almost Anything collects from each store and delivers to the customer.
   */
  multiStoreMode: DeliveryFulfillmentMode;
}

export const DEFAULT_DELIVERY_ROUTING: DeliveryRoutingPolicy = {
  singleStoreMode: "platform_driver",
  multiStoreMode: "platform_driver",
};

export function mergeDeliveryRouting(
  partial?: Partial<DeliveryRoutingPolicy> | null,
): DeliveryRoutingPolicy {
  void partial;
  return { ...DEFAULT_DELIVERY_ROUTING };
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
  courier_partner: "Almost Anything delivery",
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
