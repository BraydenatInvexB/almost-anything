export const SA_WAREHOUSE_DELIVERY_DAYS = { min: 2, max: 5 } as const;
export const INTERNATIONAL_WAREHOUSE_DELIVERY_DAYS = { min: 5, max: 7 } as const;

export function formatDeliveryWindow(min: number, max: number): string {
  return `${min} to ${max}`;
}

export function deliveryDaysForSupplierRegion(
  region: string | null | undefined,
): { min: number; max: number } {
  return region === "south_africa"
    ? { ...SA_WAREHOUSE_DELIVERY_DAYS }
    : { ...INTERNATIONAL_WAREHOUSE_DELIVERY_DAYS };
}

export function deliveryDaysForStockStatus(
  stockStatus: string | null | undefined,
  metadata?: unknown,
): { min: number; max: number } {
  const raw = (metadata ?? {}) as { stock_origin?: string };
  const origin =
    raw.stock_origin ??
    (stockStatus === "available_international" || stockStatus === "sourced"
      ? "overseas"
      : "sa_warehouse");

  if (
    origin === "overseas" ||
    stockStatus === "available_international" ||
    stockStatus === "sourced"
  ) {
    return { ...INTERNATIONAL_WAREHOUSE_DELIVERY_DAYS };
  }

  return { ...SA_WAREHOUSE_DELIVERY_DAYS };
}

/** Customer-facing delivery SLA from warehouse origin (overrides stale DB values). */
export function resolveProductDeliveryDays(input: {
  stock_status?: string | null;
  metadata?: unknown;
}): { min: number; max: number } {
  return deliveryDaysForStockStatus(input.stock_status, input.metadata);
}
