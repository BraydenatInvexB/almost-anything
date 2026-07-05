import type { CheckoutOrderRecord, ProcurementRecord, StockOrigin } from "@/lib/admin/operations-types";
import { state } from "@/lib/admin/operations-store-core";

export function listProcurement() {
  return state.procurement;
}

export function listProcurementByOrder(orderId: string, orderNumber?: string) {
  return state.procurement.filter(
    (p) =>
      p.orderId === orderId ||
      (orderNumber != null && p.orderNumber === orderNumber),
  );
}

export type CreateProcurementInput = Omit<ProcurementRecord, "id"> & { id?: string };

export function createProcurement(input: CreateProcurementInput) {
  const record: ProcurementRecord = {
    ...input,
    id: input.id ?? `proc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    quantity: input.quantity ?? 1,
  };
  state.procurement.unshift(record);
  return record;
}

const DEFAULT_SUPPLIERS: Record<StockOrigin, { name: string; country: string }> = {
  overseas: { name: "International warehouse hub", country: "Netherlands" },
  sa_warehouse: { name: "Johannesburg DC", country: "South Africa" },
};

/** Create procurement lines for each order item when payment is confirmed (idempotent). */
export function ensureProcurementForOrder(order: CheckoutOrderRecord) {
  const existing = listProcurementByOrder(order.id, order.orderNumber);
  const created: ProcurementRecord[] = [];

  for (const item of order.lineItems) {
    const dup = existing.find(
      (p) => p.orderItemId === item.id || (p.productName === item.name && !p.orderItemId),
    );
    if (dup) continue;

    const origin: StockOrigin = order.stockOrigin ?? "overseas";
    const supplier = DEFAULT_SUPPLIERS[origin];
    const costEstimate = Number((item.unitPrice * 0.55).toFixed(2));

    const record = createProcurement({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderItemId: item.id,
      productName: item.name,
      quantity: item.quantity,
      supplier: supplier.name,
      supplierCountry: supplier.country,
      costPrice: costEstimate,
      sellPrice: item.unitPrice,
      currency: order.currency,
      status: "pending",
      origin,
      notes: item.variantLabel
        ? `Variant: ${item.variantLabel}${item.selectedOptions ? ` · ${JSON.stringify(item.selectedOptions)}` : ""}`
        : undefined,
    });
    created.push(record);
  }

  return created;
}

export function receiveProcurement(id: string) {
  const idx = state.procurement.findIndex((p) => p.id === id);
  if (idx < 0) return null;

  const proc = state.procurement[idx];
  if (proc.status === "received") return proc;

  const now = new Date().toISOString();
  state.procurement[idx] = {
    ...proc,
    status: "received",
    receivedAt: now,
  };

  const invIdx = state.inventory.findIndex(
    (i) => i.sku && proc.productName.toLowerCase().includes(i.sku.slice(3, 8).toLowerCase()),
  );
  if (invIdx >= 0) {
    state.inventory[invIdx] = {
      ...state.inventory[invIdx],
      quantity: state.inventory[invIdx].quantity + proc.quantity,
      lastCountedAt: now,
    };
  }

  const orderProc = listProcurementByOrder(proc.orderId, proc.orderNumber);
  const allReceived = orderProc.every((p) => p.status === "received");
  if (allReceived) {
    const orderIdx = state.checkoutOrders.findIndex(
      (o) => o.id === proc.orderId || o.orderNumber === proc.orderNumber,
    );
    if (orderIdx >= 0 && ["paid", "sourcing"].includes(state.checkoutOrders[orderIdx].status)) {
      state.checkoutOrders[orderIdx] = {
        ...state.checkoutOrders[orderIdx],
        status: "purchased",
      };
    }
  }

  return state.procurement[idx];
}

export function updateProcurement(id: string, patch: Partial<ProcurementRecord>) {
  const idx = state.procurement.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  state.procurement[idx] = { ...state.procurement[idx], ...patch };
  return state.procurement[idx];
}
