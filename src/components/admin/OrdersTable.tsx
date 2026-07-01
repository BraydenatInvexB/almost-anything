"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { CarrierSelect, type CourierSelectOption } from "@/components/admin/CarrierSelect";
import { Table, Th, Td, EmptyState } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import type { AdminOrderSummary } from "@/services/admin-service";
import { resolveFulfillment } from "@/lib/orders/fulfillment";
import { ORDER_STATUS_LABELS, ORDER_STATUSES } from "@/lib/orders/order-operations";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS = ORDER_STATUSES.filter((s) => s !== "pending" && s !== "cancelled");

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  sourcing: "bg-violet-100 text-violet-800",
  purchased: "bg-indigo-100 text-indigo-800",
  shipped: "bg-cyan-100 text-cyan-800",
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

function defaultRow(order: AdminOrderSummary): RowState {
  return {
    status: order.status,
    carrier: order.courierName ?? "",
    trackingNumber: "",
    saving: false,
    saved: false,
    open: false,
  };
}

export function OrdersTable({
  orders,
  canManage,
  couriers,
}: {
  orders: AdminOrderSummary[];
  canManage: boolean;
  couriers: CourierSelectOption[];
}) {
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(orders.map((o) => [o.id, defaultRow(o)])),
  );

  useEffect(() => {
    setRows((prev) => {
      const next = { ...prev };
      for (const order of orders) {
        if (!next[order.id]) {
          next[order.id] = defaultRow(order);
        }
      }
      return next;
    });
  }, [orders]);

  function getRow(order: AdminOrderSummary): RowState {
    return rows[order.id] ?? defaultRow(order);
  }

  function update(id: string, patch: Partial<RowState>) {
    setRows((r) => {
      const order = orders.find((o) => o.id === id);
      const base =
        r[id] ??
        (order
          ? defaultRow(order)
          : {
              status: "pending",
              carrier: "",
              trackingNumber: "",
              saving: false,
              saved: false,
              open: false,
            });
      return { ...r, [id]: { ...base, ...patch } };
    });
  }

  async function save(o: AdminOrderSummary) {
    const row = getRow(o);
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
          <Th>Fulfillment</Th>
          <Th>Status</Th>
          <Th>Courier</Th>
          <Th>Payment</Th>
          <Th className="text-right">Total</Th>
          {canManage && <Th className="text-right">Tracking</Th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-50">
        {orders.map((o) => {
          const row = getRow(o);
          return (
            <Fragment key={o.id}>
              <tr className="hover:bg-neutral-50/80">
                <Td>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-semibold text-neutral-950 hover:text-brand"
                  >
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td>
                  <p className="font-medium text-neutral-900">{o.customerName}</p>
                  <p className="text-xs text-neutral-400">{o.customerEmail}</p>
                </Td>
                <Td className="text-neutral-500">
                  {new Date(o.createdAt).toLocaleDateString("en-ZA", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Td>
                <Td className="text-neutral-600">{o.itemCount}</Td>
                <Td>
                  <FulfillmentBadge order={o} />
                </Td>
                <Td>
                  {canManage ? (
                    <select
                      value={row.status}
                      onChange={(e) => update(o.id, { status: e.target.value })}
                      className={`rounded-full border-0 px-3 py-1 text-xs font-semibold capitalize outline-none ${STATUS_STYLES[row.status] ?? "bg-neutral-100 text-neutral-700"}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {ORDER_STATUS_LABELS[s]}
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
                <Td className="text-neutral-600">{o.courierName ?? "—"}</Td>
                <Td className="text-neutral-600">{o.paymentMethod ?? "—"}</Td>
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
                  <td colSpan={10} className="px-4 py-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="flex flex-col gap-1 text-xs text-neutral-500">
                        Carrier
                        <CarrierSelect
                          value={row.carrier}
                          onChange={(name) => update(o.id, { carrier: name })}
                          couriers={couriers}
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
                        className="h-9 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
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

function FulfillmentBadge({ order }: { order: AdminOrderSummary }) {
  const info = resolveFulfillment({
    stockOrigin: order.stockOrigin,
    shippingCountry: order.shippingCountry,
  });
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold", info.badgeClass)}>
      {info.label}
    </span>
  );
}
