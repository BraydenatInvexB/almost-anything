import type { CheckoutOrderRecord, ProcurementRecord } from "@/lib/admin/operations-types";
import {
  ensureProcurementForOrder,
  getCheckoutOrder,
  listProcurementByOrder,
  receiveProcurement,
  updateCheckoutOrder,
} from "@/lib/admin/operations-persistence";

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "sourcing",
  "purchased",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses that appear in the daily operations queue */
export const QUEUE_STATUSES: OrderStatus[] = ["paid", "sourcing", "purchased"];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Order placed",
  paid: "Payment confirmed",
  sourcing: "International warehouse",
  purchased: "Ready to ship",
  shipped: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_HINTS: Record<string, string> = {
  pending: "Awaiting customer payment.",
  paid: "Confirm supplier purchase and inbound delivery to your warehouse.",
  sourcing: "Stock allocated from international warehouse — arrange inbound to SA hub.",
  purchased: "Items received at warehouse — pack and ship to customer.",
  shipped: "Courier has the parcel — share tracking with the customer.",
  delivered: "Order complete.",
  cancelled: "Order was cancelled.",
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function isQueueStatus(status: string): boolean {
  return QUEUE_STATUSES.includes(status as OrderStatus);
}

export interface OrderOperationsPatch {
  status?: string;
  carrier?: string;
  trackingNumber?: string;
}

export interface OrderOperationsResult {
  order: CheckoutOrderRecord | null;
  procurement: ProcurementRecord[];
}

/** Apply status / tracking changes and sync procurement + inventory side-effects. */
export async function applyCheckoutOrderOperations(
  orderId: string,
  patch: OrderOperationsPatch,
): Promise<OrderOperationsResult> {
  const existing = getCheckoutOrder(orderId);
  if (!existing) {
    return { order: null, procurement: [] };
  }

  if (patch.status === "paid" || patch.status === "sourcing") {
    await ensureProcurementForOrder(existing);
  }

  const updated = updateCheckoutOrder(orderId, {
    status: patch.status,
    carrier: patch.carrier,
    trackingNumber: patch.trackingNumber,
  });

  const order = updated ?? existing;
  const procurement = await listProcurementByOrder(order.id, order.orderNumber);

  return { order, procurement };
}

export async function markProcurementReceived(procurementId: string): Promise<ProcurementRecord | null> {
  return receiveProcurement(procurementId);
}

export function procurementProgress(procurement: ProcurementRecord[]) {
  if (procurement.length === 0) {
    return { total: 0, received: 0, complete: true };
  }
  const received = procurement.filter((p) => p.status === "received").length;
  return {
    total: procurement.length,
    received,
    complete: received === procurement.length,
  };
}
