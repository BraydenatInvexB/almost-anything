import { orderNumbersMatch } from "@/lib/orders/order-number";
import type { CheckoutOrderRecord } from "@/lib/admin/operations-types";
import { state } from "@/lib/admin/operations-store-core";
import { ensureProcurementForOrder } from "@/lib/admin/operations-store-procurement";

export function listCheckoutOrders() {
  return state.checkoutOrders;
}

export function getCheckoutOrder(idOrNumber: string) {
  return (
    state.checkoutOrders.find(
      (o) => o.id === idOrNumber || orderNumbersMatch(o.orderNumber, idOrNumber),
    ) ?? null
  );
}

export function createCheckoutOrder(input: Omit<CheckoutOrderRecord, "id">) {
  const order: CheckoutOrderRecord = {
    ...input,
    id: `ord-live-${Date.now()}`,
  };
  state.checkoutOrders.unshift(order);
  const today = new Date().toISOString().slice(0, 10);
  const day = state.analytics.dailyVisits.find((d) => d.date === today);
  if (day) day.orders += 1;

  if (["paid", "sourcing", "purchased"].includes(order.status)) {
    ensureProcurementForOrder(order);
  }

  return order;
}

export function updateCheckoutOrder(
  id: string,
  patch: Partial<Pick<CheckoutOrderRecord, "status" | "carrier" | "trackingNumber">>,
) {
  const idx = state.checkoutOrders.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  state.checkoutOrders[idx] = { ...state.checkoutOrders[idx], ...patch };
  return state.checkoutOrders[idx];
}
