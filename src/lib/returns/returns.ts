import type {
  ReturnLineItem,
  ReturnReasonCode,
  ReturnRequest,
  ReturnStatus,
} from "@/lib/admin/operations-types";
import type { Order, OrderStatus } from "@/types/cart";

export const RETURN_REASONS: { code: ReturnReasonCode; label: string }[] = [
  { code: "damaged", label: "Damaged on arrival" },
  { code: "wrong_item", label: "Wrong item received" },
  { code: "not_as_described", label: "Not as described" },
  { code: "defective", label: "Defective / not working" },
  { code: "changed_mind", label: "Changed my mind" },
  { code: "other", label: "Other" },
];

export const RETURN_METHODS = [
  { value: "courier_pickup", label: "Courier pickup (prepaid label)" },
  { value: "drop_off", label: "Drop off at collection point" },
  { value: "mail_in", label: "Mail in (label provided)" },
] as const;

const RETURNABLE_STATUSES: OrderStatus[] = ["delivered", "shipped"];

export function returnReasonLabel(code: ReturnReasonCode): string {
  return RETURN_REASONS.find((r) => r.code === code)?.label ?? code.replace(/_/g, " ");
}

export function returnStatusLabel(status: ReturnStatus): string {
  const labels: Record<ReturnStatus, string> = {
    requested: "Requested",
    approved: "Approved",
    received: "Received",
    refunded: "Refunded",
    rejected: "Rejected",
  };
  return labels[status];
}

export function generateRmaNumber(): string {
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `RMA-${seq}`;
}

export function computeRefundAmount(items: ReturnLineItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.returnQuantity, 0);
}

export function canReturnOrder(status: string, createdAt: string): { ok: boolean; reason?: string } {
  if (!RETURNABLE_STATUSES.includes(status as OrderStatus)) {
    return { ok: false, reason: "Only delivered or recently shipped orders can be returned." };
  }
  const deliveredAt = new Date(createdAt);
  deliveredAt.setDate(deliveredAt.getDate() + 30);
  if (new Date() > deliveredAt) {
    return { ok: false, reason: "The 30-day return window has passed for this order." };
  }
  return { ok: true };
}

export function hasOpenReturn(returns: ReturnRequest[], orderId: string, orderNumber: string): boolean {
  return returns.some(
    (r) =>
      (r.orderId === orderId || r.orderNumber === orderNumber) &&
      r.status !== "refunded" &&
      r.status !== "rejected",
  );
}

export function orderToReturnItems(order: Order, selectedIds?: string[]): ReturnLineItem[] {
  return order.items
    .filter((item) => !selectedIds || selectedIds.includes(item.id))
    .map((item) => ({
      orderItemId: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      imageUrl: item.imageUrl,
      returnQuantity: item.quantity,
    }));
}

export interface ReturnDeskMetrics {
  open: number;
  awaitingReceipt: number;
  pendingRefund: number;
  refundedThisMonth: number;
  rejected: number;
}

export function computeReturnMetrics(returns: ReturnRequest[]): ReturnDeskMetrics {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    open: returns.filter((r) => r.status === "requested").length,
    awaitingReceipt: returns.filter((r) => r.status === "approved").length,
    pendingRefund: returns.filter((r) => r.status === "received").length,
    refundedThisMonth: returns.filter(
      (r) => r.status === "refunded" && r.resolvedAt && new Date(r.resolvedAt) >= monthStart,
    ).length,
    rejected: returns.filter((r) => r.status === "rejected").length,
  };
}

export function sortReturnsForQueue(returns: ReturnRequest[]): ReturnRequest[] {
  const priority: Record<ReturnStatus, number> = {
    requested: 0,
    approved: 1,
    received: 2,
    refunded: 3,
    rejected: 4,
  };
  return [...returns].sort((a, b) => {
    const pd = priority[a.status] - priority[b.status];
    if (pd !== 0) return pd;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function formatReturnAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}
