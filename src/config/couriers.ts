import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";

export interface CourierOption {
  id: string;
  name: string;
  /** Internal cost to the business (ZAR). */
  baseCost: number;
  etaLabel: string;
  regions: string[];
}

export const COURIERS: CourierOption[] = [
  {
    id: "courier_guy",
    name: "The Courier Guy",
    baseCost: 89,
    etaLabel: "2 to 4 business days",
    regions: ["ZA"],
  },
  {
    id: "fastway",
    name: "Fastway",
    baseCost: 79,
    etaLabel: "3 to 5 business days",
    regions: ["ZA"],
  },
  {
    id: "aramex",
    name: "Aramex",
    baseCost: 95,
    etaLabel: "2 to 3 business days",
    regions: ["ZA", "international"],
  },
];

/** All configured couriers (defaults + custom from platform settings). */
export function getAllCouriers(config?: ExtendedPlatformConfig | null): CourierOption[] {
  if (config?.couriers?.length) return config.couriers;
  return COURIERS;
}

/** Couriers enabled for checkout. */
export function getActiveCouriers(config?: ExtendedPlatformConfig | null): CourierOption[] {
  const all = getAllCouriers(config);
  const enabled = config?.enabledCourierIds ?? all.map((c) => c.id);
  return all.filter((c) => enabled.includes(c.id));
}

export function getCourier(id: string, config?: ExtendedPlatformConfig | null): CourierOption | undefined {
  return getAllCouriers(config).find((c) => c.id === id);
}

/** Customer-facing shipping charge. When embedInPrice is true, always returns 0 (cost is in item price). */
export function calculateCustomerShipping(
  subtotal: number,
  courierId: string,
  options: {
    freeShippingThreshold: number;
    flatShippingFee: number;
    embedShippingInPrice: boolean;
    freeShippingEnabled?: boolean;
    flatShippingFeeEnabled?: boolean;
    config?: ExtendedPlatformConfig | null;
  },
): { customerCharge: number; internalCost: number; displayFree: boolean } {
  const courier = getCourier(courierId, options.config) ?? getAllCouriers(options.config)[0];
  const internalCost = courier?.baseCost ?? 0;
  const freeShippingEnabled = options.freeShippingEnabled ?? false;
  const flatShippingFeeEnabled = options.flatShippingFeeEnabled ?? true;

  if (options.embedShippingInPrice) {
    return { customerCharge: 0, internalCost, displayFree: true };
  }

  if (freeShippingEnabled && subtotal >= options.freeShippingThreshold) {
    return { customerCharge: 0, internalCost, displayFree: true };
  }

  if (!flatShippingFeeEnabled) {
    return { customerCharge: internalCost, internalCost, displayFree: false };
  }

  return {
    customerCharge: options.flatShippingFee || internalCost,
    internalCost,
    displayFree: false,
  };
}
