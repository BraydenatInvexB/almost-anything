export type StockLevel = "out" | "low" | "healthy";

export function getStockLevel(quantity: number): StockLevel {
  if (quantity <= 0) return "out";
  if (quantity <= 5) return "low";
  return "healthy";
}

export const STOCK_LEVEL_LABELS: Record<StockLevel, string> = {
  out: "Out of stock",
  low: "Low stock",
  healthy: "In stock",
};

export const STOCK_LEVEL_STYLES: Record<StockLevel, string> = {
  out: "bg-red-50 text-red-700 ring-red-100",
  low: "bg-amber-50 text-amber-800 ring-amber-100",
  healthy: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export function sumStockUnits(products: { stock_quantity: number | string }[]): number {
  return products.reduce((total, product) => total + Number(product.stock_quantity), 0);
}
