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
    label: "Available international",
    description: "In stock at an overseas partner — ships internationally to the customer.",
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
  {
    value: "sourced",
    label: "Sourced on order (overseas)",
    description: "Not held in stock — purchased from overseas supplier when ordered.",
    origin: "overseas",
  },
];

export function getStockStatusLabel(status: string): string {
  return STOCK_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status.replace(/_/g, " ");
}

export function getStockStatusOrigin(status: string): StockOrigin {
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
      return `Available internationally, ships in ${deliveryDaysMin} to ${deliveryDaysMax} days`;
    case "low_stock":
      return `Limited stock — ships in ${deliveryDaysMin} to ${deliveryDaysMax} days`;
    case "sourced":
      return `Sourced on order — typically ${deliveryDaysMin} to ${deliveryDaysMax} days`;
    case "out_of_stock":
      return "Currently out of stock";
    default:
      return getStockStatusLabel(status);
  }
}
