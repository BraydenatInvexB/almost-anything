/**
 * Platform delivery fees charged at checkout by order size.
 * Admin-configurable in Settings → Shipping.
 */

import {
  DELIVERY_SIZE_RANK,
  type DeliverySize,
} from "@/lib/delivery/size";

export interface DeliveryFeeConfig {
  /** Normal parcels / medium orders (small + medium). Default R100. */
  standardZar: number;
  /** Large or bulky orders (TV, fridge, furniture). Default R200. */
  largeItemZar: number;
}

export const DEFAULT_DELIVERY_FEES: DeliveryFeeConfig = {
  standardZar: 100,
  largeItemZar: 200,
};

/** Sizes that use the large-item fee. */
const LARGE_ITEM_MIN_RANK = DELIVERY_SIZE_RANK.large;

export function mergeDeliveryFees(
  partial?: Partial<DeliveryFeeConfig> | null,
): DeliveryFeeConfig {
  const standard =
    partial?.standardZar != null && Number.isFinite(Number(partial.standardZar))
      ? Math.max(0, Number(partial.standardZar))
      : DEFAULT_DELIVERY_FEES.standardZar;
  const large =
    partial?.largeItemZar != null && Number.isFinite(Number(partial.largeItemZar))
      ? Math.max(0, Number(partial.largeItemZar))
      : DEFAULT_DELIVERY_FEES.largeItemZar;
  return { standardZar: standard, largeItemZar: large };
}

export function isLargeItemDeliverySize(size: DeliverySize): boolean {
  return DELIVERY_SIZE_RANK[size] >= LARGE_ITEM_MIN_RANK;
}

/** Fee for an order given its effective delivery size. */
export function resolveDeliveryFeeZar(
  size: DeliverySize | null | undefined,
  fees?: Partial<DeliveryFeeConfig> | null,
): number {
  const config = mergeDeliveryFees(fees);
  if (size && isLargeItemDeliverySize(size)) return config.largeItemZar;
  return config.standardZar;
}
