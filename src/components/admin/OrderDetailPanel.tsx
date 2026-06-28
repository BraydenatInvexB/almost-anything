"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, BtnPrimary, BtnSecondary, StatusBadge, DetailGrid, DetailItem, Timeline } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import type { AdminOrderDetail } from "@/services/admin-service";

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "purchased",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export function OrderDetailPanel({
  order,
  canManage,
}: {
  order: AdminOrderDetail;
  canManage: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          status,
          carrier: carrier || undefined,
          trackingNumber: trackingNumber || undefined,
        }),
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Panel title="Line items">
          <ul className="divide-y divide-neutral-100">
            {order.lineItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium text-neutral-950">{item.name}</p>
                  <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
                </div>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(item.unitPrice * item.quantity, order.currency)}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-neutral-100 px-5 py-4 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal, order.currency)}</span>
            </div>
            <div className="mt-1 flex justify-between text-neutral-600">
              <span>Shipping</span>
              <span>{formatCurrency(order.shippingCost, order.currency)}</span>
            </div>
            <div className="mt-3 flex justify-between text-base font-bold text-neutral-950">
              <span>Total</span>
              <span>{formatCurrency(order.total, order.currency)}</span>
            </div>
          </div>
        </Panel>

        <Panel title="Fulfillment timeline">
          <div className="p-5">
            <Timeline events={order.timeline} />
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Order status">
          <div className="space-y-4 p-5">
            {canManage ? (
              <>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Status
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm capitalize outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Carrier
                  <input
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    placeholder="Aramex, DHL, etc."
                    className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                  />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Tracking number
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                  />
                </label>
                <div className="flex items-center gap-2 pt-1">
                  <BtnPrimary onClick={save} disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </BtnPrimary>
                  {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
                </div>
              </>
            ) : (
              <StatusBadge status={order.status} />
            )}
          </div>
        </Panel>

        <Panel title="Customer">
          <div className="p-5">
            <DetailGrid>
              <DetailItem label="Name">{order.shippingAddress.fullName}</DetailItem>
              <DetailItem label="Email">{order.shippingAddress.email}</DetailItem>
              <DetailItem label="Phone">{order.shippingAddress.phone ?? "—"}</DetailItem>
              <DetailItem label="Payment">{order.paymentMethod}</DetailItem>
            </DetailGrid>
            {order.customerId && (
              <BtnSecondary href={`/admin/customers/${order.customerId}`} className="mt-4 w-full">
                View customer profile
              </BtnSecondary>
            )}
          </div>
        </Panel>

        <Panel title="Ship to">
          <div className="p-5 text-sm leading-relaxed text-neutral-700">
            <p className="font-medium text-neutral-950">{order.shippingAddress.fullName}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>
              {order.shippingAddress.city}, {order.shippingAddress.province}{" "}
              {order.shippingAddress.postalCode}
            </p>
            <p>{order.shippingAddress.country}</p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
