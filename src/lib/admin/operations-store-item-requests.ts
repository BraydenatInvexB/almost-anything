import type { CustomerItemRequest } from "@/lib/admin/operations-types";
import { state } from "@/lib/admin/operations-store-core";

export function listItemRequests() {
  return state.itemRequests;
}

export function getItemRequest(id: string) {
  return (
    state.itemRequests.find(
      (r) => r.id === id || r.requestNumber.toLowerCase() === id.toLowerCase(),
    ) ?? null
  );
}

export type CreateItemRequestInput = {
  id?: string;
  query: string;
  customerEmail?: string;
  budget?: number;
  currency?: string;
  urgency?: CustomerItemRequest["urgency"];
  userId?: string;
};

export function createItemRequest(input: CreateItemRequestInput) {
  const now = new Date().toISOString();
  const req: CustomerItemRequest = {
    id: input.id ?? `req-${Date.now()}`,
    requestNumber: `REQ-${Math.floor(Math.random() * 90000) + 10000}`,
    query: input.query.trim(),
    customerEmail: input.customerEmail?.trim().toLowerCase(),
    budget: input.budget,
    currency: input.currency ?? "ZAR",
    urgency: input.urgency ?? "standard",
    status: "searching",
    userId: input.userId,
    createdAt: now,
    updatedAt: now,
  };
  state.itemRequests.unshift(req);
  return req;
}

export function updateItemRequest(id: string, patch: Partial<CustomerItemRequest>) {
  const idx = state.itemRequests.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  state.itemRequests[idx] = {
    ...state.itemRequests[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  return state.itemRequests[idx];
}
