import type { AdminOrderSummary } from "@/services/admin-service";
import { QUEUE_STATUSES } from "@/lib/orders/order-operations";

/** Orders eligible for the operations kanban (server-safe). */
export function filterKanbanOrders(orders: AdminOrderSummary[]) {
  const statuses = new Set<string>([...QUEUE_STATUSES, "shipped"]);
  return orders.filter((o) => statuses.has(o.status));
}
