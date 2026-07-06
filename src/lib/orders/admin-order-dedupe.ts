import { isUuid } from "@/lib/utils/uuid";
import { normalizeOrderNumber } from "@/lib/orders/order-number";
import type { AdminOrderSummary } from "@/services/admin/types";

/** One row per order number — prefer Supabase records over in-memory demo rows. */
export function dedupeAdminOrders(orders: AdminOrderSummary[]): AdminOrderSummary[] {
  const byNumber = new Map<string, AdminOrderSummary>();

  for (const order of orders) {
    const key = normalizeOrderNumber(order.orderNumber) || order.id;
    const existing = byNumber.get(key);
    if (!existing) {
      byNumber.set(key, order);
      continue;
    }

    const orderScore = orderSourceScore(order);
    const existingScore = orderSourceScore(existing);
    if (orderScore > existingScore) {
      byNumber.set(key, order);
    }
  }

  return Array.from(byNumber.values());
}

function orderSourceScore(order: AdminOrderSummary): number {
  if (isUuid(order.id)) return 100;
  if (order.id.startsWith("ord-live-")) return 10;
  return 1;
}
