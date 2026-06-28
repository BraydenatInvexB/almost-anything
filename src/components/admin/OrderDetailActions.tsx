"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BtnPrimary, BtnSecondary, StatusBadge } from "@/components/admin/ui";

const STATUS_OPTIONS = [
  "pending",
  "paid",
  "purchased",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export function OrderDetailActions({
  orderId,
  initialStatus,
  initialCarrier = "",
  initialTracking = "",
  canManage,
}: {
  orderId: string;
  initialStatus: string;
  initialCarrier?: string;
  initialTracking?: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [trackingNumber, setTrackingNumber] = useState(initialTracking);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
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

  if (!canManage) {
    return <StatusBadge status={initialStatus} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
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
        <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Carrier
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Aramex, DHL, etc."
            className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Tracking number
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="AWB / tracking ID"
            className="mt-1.5 h-10 w-full rounded-lg border border-neutral-200 px-3 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <BtnPrimary onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </BtnPrimary>
        <BtnSecondary href={`/admin/fulfillment`}>Fulfillment queue</BtnSecondary>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved</span>}
      </div>
    </div>
  );
}
