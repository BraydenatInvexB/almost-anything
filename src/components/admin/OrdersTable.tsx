"use client";

import { Fragment, useState } from "react";
import { Table, Th, Td, EmptyState } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import type { AdminOrderSummary } from "@/services/admin-service";

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "purchased",
  "shipped",
  "delivered",
  "cancelled",
] as const;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  purchased: "bg-indigo-100 text-indigo-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};

interface RowState {
  status: string;
  carrier: string;
  trackingNumber: string;
  saving: boolean;
  saved: boolean;
  open: boolean;
}

export function OrdersTable({
  orders,
  canManage,
}: {
  orders: AdminOrderSummary[];
  canManage: boolean;
}) {
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      orders.map((o) => [
        o.id,
        { status: o.status, carrier: "", trackingNumber: "", saving: false, saved: false, open: false },
      ]),
    ),
  );

  function update(id: string, patch: Partial<RowState>) {
    setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  }

  async function save(o: AdminOrderSummary) {
    const row = rows[o.id];
    update(o.id, { saving: true, saved: false });
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: o.id,
          status: row.status,
          carrier: row.carrier || undefined,
          trackingNumber: row.trackingNumber || undefined,
        }),
      });
      update(o.id, { saving: false, saved: true });
      setTimeout(() => update(o.id, { saved: false }), 2500);
    } catch {
      update(o.id, { saving: false });
    }
  }

  if (orders.length === 0) {
    return <EmptyState title="No orders found" description="There are no orders matching this filter." />;
  }

  return (
    <Table>
      <thead>
        <tr className="border-b border-neutral-100">
          <Th>Order</Th>
          <Th>Customer</Th>
          <Th>Date</Th>
          <Th>Items</Th>
          <Th>Status</Th>
          <Th className="text-right">Total</Th>
          {canManage && <Th className="text-right">Tracking</Th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-50">
        {orders.map((o) => {
          const row = rows[o.id];
          return (
            <Fragment key={o.id}>
              <tr className="hover:bg-neutral-50">
                <Td className="font-semibold">{o.orderNumber}</Td>
                <Td>
                  <p className="font-medium text-neutral-900">{o.customerName}</p>
                  <p className="text-xs text-neutral-400">{o.customerEmail}</p>
                </Td>
                <Td className="text-neutral-500">
                  {new Date(o.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Td>
                <Td className="text-neutral-600">{o.itemCount}</Td>
                <Td>
                  {canManage ? (
                    <select
                      value={row.status}
                      onChange={(e) => update(o.id, { status: e.target.value })}
                      className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize outline-none ${STATUS_STYLES[row.status] ?? "bg-neutral-100 text-neutral-700"}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[o.status] ?? "bg-neutral-100 text-neutral-700"}`}
                    >
                      {o.status}
                    </span>
                  )}
                </Td>
                <Td className="text-right font-semibold">{formatCurrency(o.total, o.currency)}</Td>
                {canManage && (
                  <Td className="text-right">
                    <button
                      onClick={() => update(o.id, { open: !row.open })}
                      className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                    >
                      {row.open ? "Close" : "Update"}
                    </button>
                  </Td>
                )}
              </tr>
              {canManage && row.open && (
                <tr className="bg-neutral-50/60">
                  <td colSpan={7} className="px-4 py-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Carrier
                        <input
                          value={row.carrier}
                          onChange={(e) => update(o.id, { carrier: e.target.value })}
                          placeholder="e.g. Aramex"
                          className="h-9 w-44 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Tracking number
                        <input
                          value={row.trackingNumber}
                          onChange={(e) => update(o.id, { trackingNumber: e.target.value })}
                          placeholder="e.g. AWB 7741 9920 18"
                          className="h-9 w-56 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
                        />
                      </label>
                      <button
                        onClick={() => save(o)}
                        disabled={row.saving}
                        className="h-9 rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {row.saving ? "Saving..." : "Save update"}
                      </button>
                      {row.saved && (
                        <span className="text-sm font-medium text-emerald-600">Saved</span>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </Table>
  );
}
