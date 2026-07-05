export type StockOrigin = "sa_warehouse" | "overseas";

export interface InventoryRecord {
  productId: string;
  sku: string;
  quantity: number;
  reorderPoint: number;
  origin: StockOrigin;
  warehouse: string;
  lastCountedAt: string;
}
