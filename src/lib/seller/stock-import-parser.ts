import { parseImportStockOrigin } from "@/lib/product/stock-origin";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";

export interface StockImportRow {
  name: string;
  sku?: string;
  retailPrice: number;
  costPrice?: number;
  markupPercent?: number;
  quantity: number;
  category?: string;
  description?: string;
  imageUrl?: string;
  stockOrigin?: StockOrigin;
}

export function parseStockCsv(text: string): StockImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (key: string) => headers.indexOf(key);
  const num = (cols: string[], ...keys: string[]) => {
    for (const key of keys) {
      const i = idx(key);
      if (i >= 0) {
        const value = Number(cols[i]);
        if (Number.isFinite(value)) return value;
      }
    }
    return 0;
  };

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const retailPrice = num(cols, "retail_price", "price", "selling_price");
    const costPriceRaw = num(cols, "cost_price", "cost", "base_price");
    const markupRaw = num(cols, "markup_percent", "markup");
    const quantity = num(cols, "quantity", "stock");
    const warehouseRaw = cols[idx("warehouse")] ?? cols[idx("stock_origin")] ?? cols[idx("origin")];
    return {
      name: cols[idx("name")] ?? cols[idx("product")] ?? "Untitled",
      sku: cols[idx("sku")] || undefined,
      retailPrice,
      costPrice: costPriceRaw > 0 ? costPriceRaw : undefined,
      markupPercent: markupRaw > 0 ? markupRaw : undefined,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      category: cols[idx("category")] || undefined,
      description: cols[idx("description")] || undefined,
      imageUrl: cols[idx("image_url")] ?? (cols[idx("image")] || undefined),
      stockOrigin: parseImportStockOrigin(warehouseRaw) ?? undefined,
    };
  });
}

export function stockImportTemplate(): string {
  return "name,sku,cost_price,markup_percent,price,quantity,warehouse,category,description,image_url\nSample Product,SKU-001,200,25,250,25,sa_warehouse,electronics,Short description,https://example.com/image.jpg";
}
