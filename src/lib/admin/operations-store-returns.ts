import { orderNumbersMatch } from "@/lib/orders/order-number";
import type { ReturnRequest } from "@/lib/admin/operations-types";
import { state } from "@/lib/admin/operations-store-core";

export function listReturns() {
  return state.returns;
}

export function getReturn(id: string) {
  return state.returns.find((r) => r.id === id || r.rmaNumber === id) ?? null;
}

export function listReturnsByOrder(orderId: string) {
  const q = orderId.trim();
  return state.returns.filter(
    (r) => r.orderId === q || orderNumbersMatch(r.orderNumber, q),
  );
}

export function listReturnsByEmail(email: string) {
  const q = email.trim().toLowerCase();
  return state.returns.filter((r) => r.customerEmail.toLowerCase() === q);
}

export type CreateReturnInput = Omit<
  ReturnRequest,
  "id" | "rmaNumber" | "status" | "notes" | "createdAt" | "updatedAt"
> & { notes?: ReturnRequest["notes"] };

export function createReturn(input: CreateReturnInput) {
  const now = new Date().toISOString();
  const ret: ReturnRequest = {
    ...input,
    id: `ret-${Date.now()}`,
    rmaNumber: `RMA-${Math.floor(Math.random() * 90000) + 10000}`,
    status: "requested",
    notes: input.notes ?? [],
    createdAt: now,
    updatedAt: now,
  };
  state.returns.unshift(ret);
  return ret;
}

export function updateReturn(id: string, patch: Partial<ReturnRequest>) {
  const idx = state.returns.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  state.returns[idx] = {
    ...state.returns[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return state.returns[idx];
}

export function addReturnNote(
  returnId: string,
  note: Omit<ReturnRequest["notes"][number], "id" | "createdAt">,
) {
  const idx = state.returns.findIndex((r) => r.id === returnId);
  if (idx < 0) return null;
  const entry = {
    ...note,
    id: `rn-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  state.returns[idx] = {
    ...state.returns[idx],
    notes: [...state.returns[idx].notes, entry],
    updatedAt: new Date().toISOString(),
  };
  return state.returns[idx];
}
