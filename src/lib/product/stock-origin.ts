import type { StockOrigin } from "@/lib/admin/operations-inventory-types";
import type { ProductStockStatus } from "@/config/product-stock";

export const STOCK_ORIGIN_OPTIONS = [
  {
    value: "sa_warehouse" as const,
    label: "SA warehouse",
    description: "Ships from our South Africa warehouse — typically 2 to 5 business days.",
  },
  {
    value: "overseas" as const,
    label: "International warehouse",
    description: "Ships from our international warehouse — typically 5 to 7 business days.",
  },
];

export function parseStockOrigin(value: unknown): StockOrigin {
  return value === "overseas" ? "overseas" : "sa_warehouse";
}

export function stockStatusForOrigin(origin: StockOrigin, quantity: number): ProductStockStatus {
  if (quantity <= 0) return "out_of_stock";
  return origin === "sa_warehouse" ? "in_stock" : "available_international";
}

export function warehouseBadgeFromLabel(label?: string): { text: string; isSa: boolean } | null {
  if (!label) return null;
  const lower = label.toLowerCase();
  const isSa = lower.includes("south africa") || lower.includes("sa warehouse");
  return {
    text: isSa ? "SA warehouse" : "International warehouse",
    isSa,
  };
}

export function parseImportStockOrigin(raw?: string): StockOrigin | null {
  if (!raw?.trim()) return null;
  const value = raw.trim().toLowerCase();
  if (["sa", "sa warehouse", "sa_warehouse", "local", "south africa"].includes(value)) {
    return "sa_warehouse";
  }
  if (["intl", "international", "overseas", "international warehouse"].includes(value)) {
    return "overseas";
  }
  return null;
}
