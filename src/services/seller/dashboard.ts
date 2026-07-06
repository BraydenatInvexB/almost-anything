import { SELLER_PLAN_BY_ID } from "@/config/seller-plans";
import { sellerDb } from "@/lib/seller/db";
import type { SellerDashboardStats, SellerProfile } from "@/types/seller";

export async function getSellerDashboardStats(seller: SellerProfile): Promise<SellerDashboardStats> {
  const plan = SELLER_PLAN_BY_ID[seller.plan];
  const productLimit = plan?.itemLimit ?? null;
  const db = sellerDb();

  const [{ count: productCount }, { count: orderCount }] = await Promise.all([
    db
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", seller.id)
      .neq("listing_status", "archived"),
    db
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", seller.id),
  ]);

  const { data: revenueRows, error: revenueError } = await db
    .from("order_items")
    .select("unit_price, quantity")
    .eq("seller_id", seller.id);

  if (revenueError) throw revenueError;

  const revenueTotal = (revenueRows ?? []).reduce(
    (sum, row) => sum + Number(row.unit_price) * Number(row.quantity),
    0,
  );

  const { count: lowStockCount } = await db
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", seller.id)
    .gt("stock_quantity", 0)
    .lte("stock_quantity", 5);

  return {
    productCount: productCount ?? 0,
    productLimit,
    orderCount: orderCount ?? 0,
    revenueTotal,
    pendingOrders: 0,
    lowStockCount: lowStockCount ?? 0,
    subscriptionStatus: seller.subscriptionStatus,
    planLabel: plan?.name ?? seller.plan,
  };
}
