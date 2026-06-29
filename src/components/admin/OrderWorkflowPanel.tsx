"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProcurementRecord } from "@/lib/admin/operations-types";
import {
  ORDER_STATUS_HINTS,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  procurementProgress,
} from "@/lib/orders/order-operations";
import { BtnPrimary, StatusBadge } from "@/components/admin/ui";
import { cn } from "@/lib/utils/cn";

const WORKFLOW_STEPS = ["paid", "sourcing", "purchased", "shipped", "delivered"] as const;

export function OrderWorkflowPanel({
  orderId,
  orderNumber,
  initialStatus,
  procurement,
  canManage,
}: {
  orderId: string;
  orderNumber: string;
  initialStatus: string;
  procurement: ProcurementRecord[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const progress = procurementProgress(procurement);

  async function patchProcurement(
    id: string,
    patch: Partial<ProcurementRecord> & { status?: ProcurementRecord["status"] },
  ) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/procurement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not update procurement");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function advanceStatus(next: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not update order");
        return;
      }
      setStatus(next);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const stepIndex = WORKFLOW_STEPS.indexOf(status as (typeof WORKFLOW_STEPS)[number]);

  return (
    <div className="space-y-6">
      {error && <p className="rounded-xl border-2 border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {WORKFLOW_STEPS.map((step, i) => {
          const done = stepIndex > i;
          const active = status === step;
          return (
            <div
              key={step}
              className={cn(
                "flex min-w-[7.5rem] flex-1 flex-col rounded-xl border-2 px-3 py-2.5 text-center transition-colors",
                done && "border-emerald-500 bg-emerald-50",
                active && !done && "border-brand bg-brand/5 ring-1 ring-brand/20",
                !done && !active && "border-neutral-200 bg-white",
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                Step {i + 1}
              </span>
              <span className="mt-0.5 text-xs font-bold text-neutral-950">
                {ORDER_STATUS_LABELS[step]}
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-neutral-600">
        {ORDER_STATUS_HINTS[status] ?? "Update this order through the fulfillment pipeline."}
      </p>

      {procurement.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold text-neutral-950">Inbound stock ({orderNumber})</p>
              <p className="text-xs text-neutral-500">
                {progress.received} of {progress.total} lines received at warehouse
              </p>
            </div>
            {progress.complete && status !== "purchased" && canManage && (
              <BtnPrimary onClick={() => advanceStatus("purchased")} disabled={saving}>
                Mark ready to ship
              </BtnPrimary>
            )}
          </div>
          <ul className="space-y-3">
            {procurement.map((line) => (
              <li
                key={line.id}
                className="rounded-lg border border-neutral-200 bg-white p-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-neutral-950">
                      {line.productName}
                      {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {line.supplier} · {line.supplierCountry}
                    </p>
                    {line.supplierOrderRef && (
                      <p className="mt-1 text-xs text-neutral-500">Ref: {line.supplierOrderRef}</p>
                    )}
                    {line.inboundTracking && (
                      <p className="text-xs text-neutral-500">Inbound: {line.inboundTracking}</p>
                    )}
                  </div>
                  <StatusBadge status={line.status} />
                </div>
                {canManage && line.status !== "received" && line.status !== "cancelled" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {line.status === "pending" && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => patchProcurement(line.id, { status: "ordered" })}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-neutral-50"
                      >
                        Confirm supplier order
                      </button>
                    )}
                    {line.status === "ordered" && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => patchProcurement(line.id, { status: "in_transit" })}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-neutral-50"
                      >
                        In transit to warehouse
                      </button>
                    )}
                    {line.status === "in_transit" && (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => patchProcurement(line.id, { status: "received" })}
                        className="rounded-lg border-2 border-brand bg-brand px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Received at warehouse
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {canManage && (
        <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
          {status === "purchased" && (
            <BtnPrimary onClick={() => advanceStatus("shipped")} disabled={saving}>
              Mark shipped
            </BtnPrimary>
          )}
          {status === "shipped" && (
            <BtnPrimary onClick={() => advanceStatus("delivered")} disabled={saving}>
              Mark delivered
            </BtnPrimary>
          )}
          {ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number]) &&
            status !== "cancelled" &&
            status !== "delivered" && (
              <select
                value={status}
                onChange={(e) => advanceStatus(e.target.value)}
                disabled={saving}
                className="h-10 rounded-lg border-2 border-neutral-200 bg-white px-3 text-sm font-medium outline-none focus:border-brand"
              >
                {ORDER_STATUSES.filter((s) => s !== "pending").map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            )}
        </div>
      )}
    </div>
  );
}
