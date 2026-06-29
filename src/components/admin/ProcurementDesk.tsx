"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProcurementRecord } from "@/lib/admin/operations-types";
import { StatusBadge, Table, Th, Td, BtnPrimary } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { Pencil } from "lucide-react";

export function ProcurementDesk({
  records,
  canManage,
}: {
  records: ProcurementRecord[];
  canManage: boolean;
}) {
  const [editing, setEditing] = useState<ProcurementRecord | null>(null);

  return (
    <>
      <div className="rounded-xl border border-neutral-200/80 bg-white shadow-sm">
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Product</Th>
              <Th>Qty</Th>
              <Th>Supplier</Th>
              <Th>Est. cost</Th>
              <Th>Paid</Th>
              <Th>Margin</Th>
              <Th>Status</Th>
              {canManage && <Th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {records.map((p) => {
              const paid = p.actualCostPaid ?? p.costPrice;
              const margin = p.sellPrice * p.quantity - paid;
              return (
                <tr key={p.id} className="hover:bg-neutral-50/50">
                  <Td>
                    <Link
                      href={`/admin/orders/${p.orderId}`}
                      className="font-bold text-brand hover:underline"
                    >
                      {p.orderNumber}
                    </Link>
                  </Td>
                  <Td>
                    <p className="font-medium">{p.productName}</p>
                    {p.supplierOrderRef && (
                      <p className="text-xs text-neutral-400">Ref {p.supplierOrderRef}</p>
                    )}
                  </Td>
                  <Td>{p.quantity}</Td>
                  <Td>
                    <p>{p.supplier}</p>
                    <p className="text-xs text-neutral-400">{p.supplierCountry}</p>
                  </Td>
                  <Td>{formatCurrency(p.costPrice, p.currency)}</Td>
                  <Td className="font-semibold">
                    {p.actualCostPaid != null
                      ? formatCurrency(p.actualCostPaid, p.currency)
                      : "—"}
                  </Td>
                  <Td className={margin >= 0 ? "text-emerald-600" : "text-red-600"}>
                    {formatCurrency(margin, p.currency)}
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  {canManage && (
                    <Td>
                      <button
                        type="button"
                        onClick={() => setEditing(p)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand"
                      >
                        <Pencil className="h-3 w-3" />
                        Manage
                      </button>
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
        {records.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-neutral-500">
            Procurement lines appear when customers pay for orders.
          </p>
        )}
      </div>

      {editing && canManage && (
        <ProcurementEditModal record={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function ProcurementEditModal({
  record,
  onClose,
}: {
  record: ProcurementRecord;
  onClose: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    status: record.status,
    supplier: record.supplier,
    supplierOrderRef: record.supplierOrderRef ?? "",
    inboundTracking: record.inboundTracking ?? "",
    costPrice: String(record.costPrice),
    actualCostPaid: record.actualCostPaid != null ? String(record.actualCostPaid) : "",
    expectedAt: record.expectedAt?.slice(0, 10) ?? "",
    notes: record.notes ?? "",
  });

  async function save() {
    setBusy(true);
    try {
      await fetch("/api/admin/procurement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          status: form.status,
          supplier: form.supplier,
          supplierOrderRef: form.supplierOrderRef || undefined,
          inboundTracking: form.inboundTracking || undefined,
          costPrice: Number(form.costPrice),
          actualCostPaid: form.actualCostPaid ? Number(form.actualCostPaid) : undefined,
          expectedAt: form.expectedAt ? new Date(form.expectedAt).toISOString() : undefined,
          notes: form.notes || undefined,
        }),
      });
      router.refresh();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/30" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-neutral-950">Manage inbound purchase</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {record.orderNumber} · {record.productName}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Status">
            <select
              className="input w-full"
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as ProcurementRecord["status"] })
              }
            >
              {["pending", "ordered", "in_transit", "received", "cancelled"].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Supplier">
            <input
              className="input w-full"
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
            />
          </Field>
          <Field label="Supplier order ref">
            <input
              className="input w-full"
              value={form.supplierOrderRef}
              onChange={(e) => setForm({ ...form, supplierOrderRef: e.target.value })}
            />
          </Field>
          <Field label="Inbound tracking">
            <input
              className="input w-full"
              value={form.inboundTracking}
              onChange={(e) => setForm({ ...form, inboundTracking: e.target.value })}
            />
          </Field>
          <Field label="Estimated cost (ZAR)">
            <input
              type="number"
              step="0.01"
              className="input w-full"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
          </Field>
          <Field label="Amount paid (ZAR)">
            <input
              type="number"
              step="0.01"
              className="input w-full"
              value={form.actualCostPaid}
              onChange={(e) => setForm({ ...form, actualCostPaid: e.target.value })}
              placeholder="What you actually paid"
            />
          </Field>
          <Field label="Expected arrival">
            <input
              type="date"
              className="input w-full"
              value={form.expectedAt}
              onChange={(e) => setForm({ ...form, expectedAt: e.target.value })}
            />
          </Field>
          <Field label="Sell price">
            <input
              className="input w-full bg-neutral-50"
              readOnly
              value={formatCurrency(record.sellPrice, record.currency)}
            />
          </Field>
        </div>
        <Field label="Internal notes">
          <textarea
            className="input mt-1 min-h-[80px] w-full"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>

        <div className="mt-6 flex gap-2">
          <BtnPrimary onClick={save} disabled={busy}>
            {busy ? "Saving…" : "Save purchase record"}
          </BtnPrimary>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-neutral-600">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
