import type { StockOrigin } from "@/lib/admin/operations-types";

export type ProductStockStatus =
  | "in_stock"
  | "available_international"
  | "low_stock"
  | "out_of_stock"
  | "sourced";

export const STOCK_STATUS_OPTIONS: {
  value: ProductStockStatus;
  label: string;
  description: string;
  origin: StockOrigin;
}[] = [
  {
    value: "in_stock",
    label: "In stock (SA warehouse)",
    description: "Available now from the South Africa warehouse.",
    origin: "sa_warehouse",
  },
  {
    value: "available_international",
    label: "In stock (international warehouse)",
    description: "In stock at our international warehouse — ships to customers after hub processing.",
    origin: "overseas",
  },
  {
    value: "low_stock",
    label: "Low stock (SA warehouse)",
    description: "Limited quantity remaining in the SA warehouse.",
    origin: "sa_warehouse",
  },
  {
    value: "out_of_stock",
    label: "Out of stock",
    description: "Temporarily unavailable — not accepting orders.",
    origin: "sa_warehouse",
  },
];

export function getWarehouseBadgeLabel(status: string, metadata?: unknown): string {
  const raw = (metadata ?? {}) as { stock_origin?: string };
  const origin =
    raw.stock_origin ??
    (status === "available_international" || status === "sourced" ? "overseas" : "sa_warehouse");

  if (origin === "sa_warehouse" || status === "in_stock" || status === "low_stock") {
    return "South Africa warehouse";
  }
  return "International warehouse";
}

export function getStockStatusLabel(status: string): string {
  if (status === "sourced") return "In stock (international warehouse)";
  return STOCK_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status.replace(/_/g, " ");
}

export function getStockStatusLabelFromMetadata(
  status: string,
  metadata?: unknown,
): string {
  const raw = (metadata ?? {}) as { stock_origin?: string };
  if (status === "sourced" || status === "available_international") {
    if (raw.stock_origin === "sa_warehouse") {
      return "In stock (SA warehouse)";
    }
  }
  return getStockStatusLabel(status);
}

export function getStockStatusOrigin(status: string): StockOrigin {
  if (status === "sourced" || status === "available_international") return "overseas";
  return STOCK_STATUS_OPTIONS.find((o) => o.value === status)?.origin ?? "sa_warehouse";
}

export function isSellableStockStatus(status: string): boolean {
  return ["in_stock", "available_international", "low_stock", "sourced"].includes(status);
}

export function getStockAvailabilityMessage(
  status: string,
  deliveryDaysMin: number,
  deliveryDaysMax: number,
): string {
  switch (status) {
    case "in_stock":
      return `In stock, ships in ${deliveryDaysMin} to ${deliveryDaysMax} days`;
    case "available_international":
    case "sourced":
      return `In stock (international warehouse) — ships in ${deliveryDaysMin} to ${deliveryDaysMax} days`;
    case "low_stock":
      return `Limited stock — ships in ${deliveryDaysMin} to ${deliveryDaysMax} days`;
    case "out_of_stock":
      return "Currently out of stock";
    default:
      return getStockStatusLabel(status);
  }
}
