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
    id: "almost_anything",
    name: "Almost Anything Delivery",
    baseCost: 100,
    etaLabel: "Delivery coordinated by Almost Anything",
    regions: ["ZA"],
  },
];

/** Almost Anything currently handles every customer delivery in-house. */
export function getAllCouriers(config?: ExtendedPlatformConfig | null): CourierOption[] {
  void config;
  return COURIERS;
}

export function getActiveCouriers(config?: ExtendedPlatformConfig | null): CourierOption[] {
  void config;
  return COURIERS;
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
  const courier = getCourier(courierId, options.config) ?? COURIERS[0];
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
