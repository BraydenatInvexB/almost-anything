import type { AdminOrderSummary } from "@/services/admin-service";
import { QUEUE_STATUSES } from "@/lib/orders/order-operations";

/** Orders shown on the fulfillment pipeline table. */
export function filterPipelineOrders(orders: AdminOrderSummary[]) {
  const statuses = new Set<string>([...QUEUE_STATUSES, "shipped"]);
  return orders.filter((o) => statuses.has(o.status));
}
