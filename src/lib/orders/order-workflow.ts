import type { AdminOrderSummary } from "@/services/admin/types";
import { QUEUE_STATUSES, getOrderStatusLabel } from "@/lib/orders/order-operations";

export type OperationsTabId = "action" | "shipping" | "all";

export interface OperationsStage {
  id: OperationsTabId;
  label: string;
  description: string;
  statuses: string[];
}

export const OPERATIONS_STAGES: OperationsStage[] = [
  {
    id: "action",
    label: "Needs action",
    description: "Orders waiting on your team — confirm stock, receive inbound, or ship to customer.",
    statuses: [...QUEUE_STATUSES],
  },
  {
    id: "shipping",
    label: "Out for delivery",
    description: "Parcels handed to couriers — monitor tracking and mark delivered when complete.",
    statuses: ["shipped"],
  },
  {
    id: "all",
    label: "All open",
    description: "Every active order that is not pending payment, delivered, or cancelled.",
    statuses: [...QUEUE_STATUSES, "shipped"],
  },
];

export const ORDER_NEXT_ACTION: Record<string, string> = {
  paid: "Confirm supplier purchase and start inbound to your warehouse.",
  sourcing: "Track inbound stock and mark received when it hits your hub.",
  purchased: "Pack the order, add courier tracking, and mark shipped.",
  shipped: "Confirm delivery with the customer and mark delivered.",
  delivered: "No action — order complete.",
  pending: "Waiting for customer payment.",
  cancelled: "No action — order cancelled.",
};

export function getOrderNextAction(status: string): string {
  return ORDER_NEXT_ACTION[status] ?? "Review this order in detail.";
}

export function filterOrdersForTab(
  orders: AdminOrderSummary[],
  tab: OperationsTabId,
): AdminOrderSummary[] {
  const stage = OPERATIONS_STAGES.find((s) => s.id === tab) ?? OPERATIONS_STAGES[0];
  const allowed = new Set(stage.statuses);
  return orders.filter((o) => allowed.has(o.status));
}

export function countOrdersByStatus(orders: AdminOrderSummary[], statuses: string[]): number {
  const allowed = new Set(statuses);
  return orders.filter((o) => allowed.has(o.status)).length;
}

export function stageCountLabel(tab: OperationsTabId, count: number): string {
  const stage = OPERATIONS_STAGES.find((s) => s.id === tab);
  if (!stage) return String(count);
  if (count === 0) return `No orders in ${stage.label.toLowerCase()}`;
  return `${count} order${count === 1 ? "" : "s"} · ${stage.label.toLowerCase()}`;
}

export function formatOrderStatus(status: string): string {
  return getOrderStatusLabel(status);
}
