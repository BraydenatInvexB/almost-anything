"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Expense } from "@/lib/admin/operations-types";
import {
  BtnPrimary,
  Panel,
  StatCard,
  StatusBadge,
  Table,
  Th,
  Td,
  EmptyState,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { EXPENSE_CATEGORY_LABELS } from "@/components/admin/finance-dashboard-shared";

export function FinanceExpensesTab({
  expenses,
  canManage,
  currency,
}: {
  expenses: Expense[];
  canManage: boolean;
  currency: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    label: "",
    category: "operations",
    amount: "",
    vendor: "",
    notes: "",
  });
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        currency,
      }),
    });
    setForm({ label: "", category: "operations", amount: "", vendor: "", notes: "" });
    router.refresh();
  }

  return (
    <>
      <StatCard label="Total recorded expenses" value={formatCurrency(total, currency)} accent="bg-red-600" />
      {canManage && (
        <Panel title="Record expense">
          <form onSubmit={addExpense} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="input sm:col-span-2"
              placeholder="Description"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {Object.entries(EXPENSE_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              placeholder="Amount (ZAR)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Vendor / payee"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
            <input
              className="input sm:col-span-2"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <BtnPrimary type="submit">Record expense</BtnPrimary>
            </div>
          </form>
        </Panel>
      )}
      <Panel title="Expense ledger">
        {expenses.length === 0 ? (
          <EmptyState
            title="No expenses recorded"
            description={canManage ? "Record your first operating expense above." : "Expenses will appear here once recorded."}
          />
        ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th>Vendor</Th>
              <Th>Recorded by</Th>
              <Th className="text-right">Amount</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {expenses.map((e) => (
              <tr key={e.id}>
                <Td className="text-neutral-500">
                  {new Date(e.recordedAt).toLocaleDateString("en-ZA")}
                </Td>
                <Td>
                  <p className="font-medium">{e.label}</p>
                  {e.notes && <p className="text-xs text-neutral-400">{e.notes}</p>}
                </Td>
                <Td><StatusBadge status={e.category} /></Td>
                <Td className="text-neutral-500">{e.vendor ?? "—"}</Td>
                <Td className="text-neutral-500">{e.recordedBy}</Td>
                <Td className="text-right font-semibold text-red-600">
                  {formatCurrency(e.amount, e.currency)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        )}
      </Panel>
    </>
  );
}
