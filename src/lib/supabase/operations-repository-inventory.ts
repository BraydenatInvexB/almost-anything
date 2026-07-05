import type { InventoryRecord, StockOrigin } from "@/lib/admin/operations-types";
import { mapInventoryRow } from "@/lib/supabase/operations-mappers";
import { asRow, asRows, tbl } from "@/lib/supabase/operations-repository-shared";

async function bootstrapInventoryFromProducts(): Promise<void> {
  const { count } = await tbl("inventory_records").select("*", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;

  const { data: products } = await tbl("products").select("id, slug, stock_status");
  if (!products?.length) return;

  await tbl("inventory_records").insert(
    asRows(products).map((row) => {
      const stockStatus = String(row.stock_status ?? "sourced");
      const origin: StockOrigin = stockStatus === "in_stock" ? "sa_warehouse" : "overseas";
      const quantity = stockStatus === "in_stock" ? 12 : stockStatus === "low_stock" ? 3 : 0;
      return {
        product_id: String(row.id),
        sku: `AA-${String(row.slug).slice(0, 8).toUpperCase()}`,
        quantity,
        reorder_point: 5,
        origin,
        warehouse: origin === "sa_warehouse" ? "Johannesburg DC" : "International pipeline",
        last_counted_at: new Date().toISOString(),
      };
    }),
  );
}

export async function listInventory(): Promise<InventoryRecord[]> {
  await bootstrapInventoryFromProducts();
  const { data, error } = await tbl("inventory_records")
    .select("*")
    .order("sku", { ascending: true });
  if (error) throw error;
  return asRows(data).map((r) => mapInventoryRow(r));
}

export async function updateInventory(
  productId: string,
  patch: Partial<InventoryRecord>,
): Promise<InventoryRecord | null> {
  const update: Record<string, unknown> = { last_counted_at: new Date().toISOString() };
  if (patch.sku !== undefined) update.sku = patch.sku;
  if (patch.quantity !== undefined) update.quantity = patch.quantity;
  if (patch.reorderPoint !== undefined) update.reorder_point = patch.reorderPoint;
  if (patch.origin !== undefined) update.origin = patch.origin;
  if (patch.warehouse !== undefined) update.warehouse = patch.warehouse;

  const { data, error } = await tbl("inventory_records")
    .update(update)
    .eq("product_id", productId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapInventoryRow(asRow(data)) : null;
}
