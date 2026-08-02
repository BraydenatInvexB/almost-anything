/**
 * Delivery size tiers for marketplace logistics.
 *
 * Takealot uses volumetric (cm³) + weight bands for fulfilment fees — accurate
 * but sellers often get dims wrong, and customers barely see the meaning.
 *
 * We use plain-language size classes focused on *how the order must travel*:
 * vehicle type + handling. Sellers pick one when listing; customers only see a
 * short note at checkout when something larger than a parcel is involved;
 * drivers see the vehicle requirement on the job.
 */

export const DELIVERY_SIZES = ["small", "medium", "large", "bulky"] as const;

export type DeliverySize = (typeof DELIVERY_SIZES)[number];

export const DEFAULT_DELIVERY_SIZE: DeliverySize = "small";

/** Rank used to resolve an order's effective size (max wins). */
export const DELIVERY_SIZE_RANK: Record<DeliverySize, number> = {
  small: 1,
  medium: 2,
  large: 3,
  bulky: 4,
};

export interface DeliverySizeInfo {
  id: DeliverySize;
  /** Short label for seller/admin forms */
  label: string;
  /** Examples to help sellers choose correctly */
  examples: string;
  /** What drivers / ops need to know */
  vehicleHint: string;
  /** Customer-facing checkout note (null = don't show — parcel is normal) */
  customerNote: string | null;
  /** Whether two-person handling is recommended */
  mayNeedTwoPeople: boolean;
}

export const DELIVERY_SIZE_INFO: Record<DeliverySize, DeliverySizeInfo> = {
  small: {
    id: "small",
    label: "Small (parcel)",
    examples: "Phones, clothing, accessories, small gadgets",
    vehicleHint: "Fits in a car boot or on a bike",
    customerNote: null,
    mayNeedTwoPeople: false,
  },
  medium: {
    id: "medium",
    label: "Medium",
    examples: "Microwaves, small appliances, boxed sets",
    vehicleHint: "Needs a hatchback or sedan with boot space",
    customerNote: "Some items need a bit more boot space than a small parcel.",
    mayNeedTwoPeople: false,
  },
  large: {
    id: "large",
    label: "Large",
    examples: "TVs, monitors, desks, larger appliances",
    vehicleHint: "Bakkie or van recommended",
    customerNote:
      "This order includes larger items (like a TV). We'll use a bakkie or van for delivery.",
    mayNeedTwoPeople: false,
  },
  bulky: {
    id: "bulky",
    label: "Bulky",
    examples: "Fridges, washing machines, sofas, gym equipment",
    vehicleHint: "Bakkie required — two people may be needed",
    customerNote:
      "This order includes bulky items. Delivery may use a larger vehicle and could need help unloading at your door.",
    mayNeedTwoPeople: true,
  },
};

export const DELIVERY_SIZE_OPTIONS = DELIVERY_SIZES.map((id) => DELIVERY_SIZE_INFO[id]);

export function isDeliverySize(value: unknown): value is DeliverySize {
  return typeof value === "string" && (DELIVERY_SIZES as readonly string[]).includes(value);
}

export function parseDeliverySize(value: unknown): DeliverySize {
  if (isDeliverySize(value)) return value;
  return DEFAULT_DELIVERY_SIZE;
}

/** Read from product metadata (supports snake_case + camelCase keys). */
export function parseDeliverySizeFromMetadata(metadata: unknown): DeliverySize {
  if (!metadata || typeof metadata !== "object") return DEFAULT_DELIVERY_SIZE;
  const meta = metadata as Record<string, unknown>;
  return parseDeliverySize(meta.delivery_size ?? meta.deliverySize);
}

export function deliverySizeMetadata(size: DeliverySize): { delivery_size: DeliverySize } {
  return { delivery_size: size };
}

/** Highest size across a list of item sizes (order-level requirement). */
export function resolveOrderDeliverySize(sizes: DeliverySize[]): DeliverySize {
  if (sizes.length === 0) return DEFAULT_DELIVERY_SIZE;
  return sizes.reduce((max, size) =>
    DELIVERY_SIZE_RANK[size] > DELIVERY_SIZE_RANK[max] ? size : max,
  );
}

export function getDeliverySizeInfo(size: DeliverySize): DeliverySizeInfo {
  return DELIVERY_SIZE_INFO[size];
}

export interface OrderDeliverySizeSummary {
  size: DeliverySize;
  label: string;
  vehicleHint: string;
  customerNote: string | null;
  mayNeedTwoPeople: boolean;
  /** True when checkout should surface the note to the customer */
  showCustomerNote: boolean;
}

export function summarizeOrderDeliverySize(sizes: DeliverySize[]): OrderDeliverySizeSummary {
  const size = resolveOrderDeliverySize(sizes);
  const info = getDeliverySizeInfo(size);
  return {
    size,
    label: info.label,
    vehicleHint: info.vehicleHint,
    customerNote: info.customerNote,
    mayNeedTwoPeople: info.mayNeedTwoPeople,
    showCustomerNote: Boolean(info.customerNote),
  };
}
