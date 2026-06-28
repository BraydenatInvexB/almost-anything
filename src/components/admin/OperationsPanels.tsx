"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Expense, InventoryRecord, ProcurementRecord, ReturnRequest } from "@/lib/admin/operations-types";
import { BtnPrimary, StatusBadge, Table, Th, Td } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";

export function FinancePanel({ expenses, canManage, revenue }: { expenses: Expense[]; canManage: boolean; revenue: number }) {
  const router = useRouter();
  const [form, setForm] = useState({ label: "", category: "operations", amount: "", vendor: "" });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount), currency: "ZAR" }),
    });
    setForm({ label: "", category: "operations", amount: "", vendor: "" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-neutral-500">Revenue</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(revenue, "ZAR")}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-neutral-500">Expenses</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(totalExpenses, "ZAR")}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-neutral-500">Net</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(revenue - totalExpenses, "ZAR")}</p>
        </div>
      </div>

      {canManage && (
        <form onSubmit={addExpense} className="flex flex-wrap gap-2 rounded-xl border bg-white p-4 shadow-sm">
          <input className="input min-w-[180px] flex-1" placeholder="Expense label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          <select className="input w-40" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {["procurement", "shipping", "marketing", "payroll", "operations", "refunds", "other"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input className="input w-28" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <input className="input w-36" placeholder="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <BtnPrimary type="submit">Record expense</BtnPrimary>
        </form>
      )}

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <thead><tr><Th>Date</Th><Th>Label</Th><Th>Category</Th><Th>Vendor</Th><Th className="text-right">Amount</Th></tr></thead>
          <tbody className="divide-y divide-neutral-50">
            {expenses.map((e) => (
              <tr key={e.id}>
                <Td className="text-neutral-500">{new Date(e.recordedAt).toLocaleDateString()}</Td>
                <Td className="font-medium">{e.label}</Td>
                <Td><StatusBadge status={e.category} /></Td>
                <Td className="text-neutral-500">{e.vendor ?? "—"}</Td>
                <Td className="text-right font-semibold">{formatCurrency(e.amount, e.currency)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export function ReturnsPanel({ returns, canManage }: { returns: ReturnRequest[]; canManage: boolean }) {
  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <Table>
        <thead>
          <tr>
            <Th>RMA</Th>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Reason</Th>
            <Th>Status</Th>
            <Th>Refund</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {returns.map((r) => (
            <tr key={r.id}>
              <Td>
                <Link href={`/admin/returns/${r.id}`} className="font-mono text-sm font-semibold text-brand hover:underline">
                  {r.rmaNumber}
                </Link>
              </Td>
              <Td className="font-semibold">{r.orderNumber}</Td>
              <Td>
                <p>{r.customerName}</p>
                <p className="text-xs text-neutral-400">{r.customerEmail}</p>
              </Td>
              <Td className="max-w-xs truncate text-neutral-600">{r.reason}</Td>
              <Td><StatusBadge status={r.status} /></Td>
              <Td>{r.refundAmount ? formatCurrency(r.refundAmount, r.currency) : "—"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {canManage && (
        <p className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500">
          Manage returns in the{" "}
          <Link href="/admin/returns" className="font-semibold text-brand hover:underline">
            Returns desk
          </Link>
          .
        </p>
      )}
    </div>
  );
}

export function InventoryPanel({
  inventory,
  products,
  canManage,
}: {
  inventory: InventoryRecord[];
  products: { id: string; name: string }[];
  canManage: boolean;
}) {
  const router = useRouter();
  const nameMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  async function adjust(productId: string, quantity: number) {
    await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity }),
    });
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <Table>
        <thead><tr><Th>SKU</Th><Th>Product</Th><Th>Qty</Th><Th>Origin</Th><Th>Warehouse</Th><Th>Reorder at</Th>{canManage && <Th />}</tr></thead>
        <tbody className="divide-y divide-neutral-50">
          {inventory.map((row) => (
            <tr key={row.productId}>
              <Td className="font-mono text-xs">{row.sku}</Td>
              <Td className="font-medium">{nameMap[row.productId] ?? row.productId}</Td>
              <Td className={row.quantity <= row.reorderPoint ? "font-bold text-red-600" : ""}>{row.quantity}</Td>
              <Td><StatusBadge status={row.origin === "sa_warehouse" ? "in_stock" : "sourced"} /></Td>
              <Td className="text-neutral-500">{row.warehouse}</Td>
              <Td>{row.reorderPoint}</Td>
              {canManage && (
                <Td>
                  <button type="button" onClick={() => adjust(row.productId, row.quantity + 10)} className="text-xs font-semibold text-brand">+10 stock</button>
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export function ProcurementPanel({ records, canManage }: { records: ProcurementRecord[]; canManage: boolean }) {
  const router = useRouter();

  async function update(id: string, status: ProcurementRecord["status"]) {
    await fetch("/api/admin/procurement", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-white shadow-sm">
      <Table>
        <thead><tr><Th>Order</Th><Th>Product</Th><Th>Supplier</Th><Th>Cost</Th><Th>Sell</Th><Th>Origin</Th><Th>Status</Th>{canManage && <Th />}</tr></thead>
        <tbody className="divide-y divide-neutral-50">
          {records.map((p) => (
            <tr key={p.id}>
              <Td className="font-semibold">{p.orderNumber}</Td>
              <Td>{p.productName}</Td>
              <Td><p>{p.supplier}</p><p className="text-xs text-neutral-400">{p.supplierCountry}</p></Td>
              <Td>{formatCurrency(p.costPrice, p.currency)}</Td>
              <Td>{formatCurrency(p.sellPrice, p.currency)}</Td>
              <Td>{p.origin === "sa_warehouse" ? "SA stock" : "Overseas"}</Td>
              <Td><StatusBadge status={p.status} /></Td>
              {canManage && (
                <Td>
                  {p.status === "pending" && <button type="button" onClick={() => update(p.id, "ordered")} className="text-xs font-semibold text-brand">Mark ordered</button>}
                  {p.status === "ordered" && <button type="button" onClick={() => update(p.id, "in_transit")} className="text-xs font-semibold text-brand">In transit</button>}
                  {p.status === "in_transit" && <button type="button" onClick={() => update(p.id, "received")} className="text-xs font-semibold text-brand">Received</button>}
                </Td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
