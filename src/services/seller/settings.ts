import type { StockOrigin } from "@/lib/admin/operations-inventory-types";
import { parseStockOrigin } from "@/lib/product/stock-origin";
import { sellerDb } from "@/lib/seller/db";

export async function updateSellerDefaultStockOrigin(
  sellerId: string,
  defaultStockOrigin: StockOrigin,
): Promise<StockOrigin> {
  const origin = parseStockOrigin(defaultStockOrigin);
  const { data, error } = await sellerDb()
    .from("sellers")
    .update({ default_stock_origin: origin })
    .eq("id", sellerId)
    .select("default_stock_origin")
    .single();

  if (error) throw error;
  return parseStockOrigin(data?.default_stock_origin);
}
