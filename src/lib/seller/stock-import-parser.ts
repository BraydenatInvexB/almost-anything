export interface StockImportRow {
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  category?: string;
  description?: string;
  imageUrl?: string;
}

export function parseStockCsv(text: string): StockImportRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (key: string) => headers.indexOf(key);

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const price = Number(cols[idx("price")] ?? cols[idx("retail_price")] ?? 0);
    const quantity = Number(cols[idx("quantity")] ?? cols[idx("stock")] ?? 0);
    return {
      name: cols[idx("name")] ?? cols[idx("product")] ?? "Untitled",
      sku: cols[idx("sku")] || undefined,
      price: Number.isFinite(price) ? price : 0,
      quantity: Number.isFinite(quantity) ? quantity : 0,
      category: cols[idx("category")] || undefined,
      description: cols[idx("description")] || undefined,
      imageUrl: cols[idx("image_url")] ?? (cols[idx("image")] || undefined),
    };
  });
}

export function stockImportTemplate(): string {
  return "name,sku,price,quantity,category,description,image_url\nSample Product,SKU-001,299.99,25,electronics,Short description,https://example.com/image.jpg";
}
