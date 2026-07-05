import type { Expense } from "@/lib/admin/operations-types";
import type { SupplierPayable } from "@/lib/admin/finance-types";
import { state } from "@/lib/admin/operations-store-core";

export function listExpenses() {
  return state.expenses;
}

export function createExpense(input: Omit<Expense, "id" | "recordedAt">) {
  const expense: Expense = {
    ...input,
    id: `exp-${Date.now()}`,
    recordedAt: new Date().toISOString(),
  };
  state.expenses.unshift(expense);
  return expense;
}

export function listPayables() {
  return state.payables;
}

export function updatePayable(id: string, patch: Partial<SupplierPayable>) {
  const idx = state.payables.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  state.payables[idx] = { ...state.payables[idx], ...patch };
  return state.payables[idx];
}

export function createPayable(input: Omit<SupplierPayable, "id" | "createdAt">) {
  const payable = {
    ...input,
    id: `pay-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  state.payables.unshift(payable);
  return payable;
}
