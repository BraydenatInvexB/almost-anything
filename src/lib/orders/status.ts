import type { OrderStatus } from "@/types/cart";

/**
 * Customer-facing order journey. Internal back-office states (sourcing,
 * purchased) are intentionally collapsed into a single neutral "Preparing"
 * step so customers only ever see a clean, confident fulfilment flow.
 */
export const TRACK_STEPS = [
  "Order placed",
  "Confirmed",
  "Preparing",
  "Shipped",
  "Delivered",
] as const;

interface CustomerStatus {
  /** Friendly label shown to customers. */
  label: string;
  /** Index into TRACK_STEPS (-1 for cancelled). */
  step: number;
  /** Tailwind classes for a status badge. */
  badge: string;
  /** Short reassuring description. */
  description: string;
}

export const CUSTOMER_STATUS: Record<OrderStatus, CustomerStatus> = {
  pending: {
    label: "Order placed",
    step: 0,
    badge: "bg-amber-100 text-amber-800",
    description: "We've received your order and it's awaiting confirmation.",
  },
  paid: {
    label: "Confirmed",
    step: 1,
    badge: "bg-blue-100 text-blue-800",
    description: "Payment confirmed. We're getting your order ready.",
  },
  sourcing: {
    label: "Preparing your order",
    step: 2,
    badge: "bg-indigo-100 text-indigo-800",
    description: "Your order is being prepared for dispatch.",
  },
  purchased: {
    label: "Preparing your order",
    step: 2,
    badge: "bg-indigo-100 text-indigo-800",
    description: "Your order is being prepared for dispatch.",
  },
  shipped: {
    label: "Shipped",
    step: 3,
    badge: "bg-violet-100 text-violet-800",
    description: "Your order is on its way to you.",
  },
  delivered: {
    label: "Delivered",
    step: 4,
    badge: "bg-emerald-100 text-emerald-800",
    description: "Delivered. We hope you love it!",
  },
  cancelled: {
    label: "Cancelled",
    step: -1,
    badge: "bg-red-100 text-red-700",
    description: "This order was cancelled.",
  },
};

export function customerStatus(status: OrderStatus): CustomerStatus {
  return CUSTOMER_STATUS[status] ?? CUSTOMER_STATUS.pending;
}
