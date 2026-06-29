"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminOrderSummary } from "@/services/admin-service";
import { ORDER_STATUS_LABELS } from "@/lib/orders/order-operations";
import { formatCurrency } from "@/lib/utils/cn";
import { StatusBadge } from "@/components/admin/ui";

const KANBAN_COLUMNS = [
  { status: "paid", label: ORDER_STATUS_LABELS.paid },
  { status: "sourcing", label: ORDER_STATUS_LABELS.sourcing },
  { status: "purchased", label: ORDER_STATUS_LABELS.purchased },
  { status: "shipped", label: ORDER_STATUS_LABELS.shipped },
] as const;

export function OrdersKanban({
  orders,
  canManage,
}: {
  orders: AdminOrderSummary[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const columns = useMemo(() => {
    const map: Record<string, AdminOrderSummary[]> = {};
    for (const col of KANBAN_COLUMNS) {
      map[col.status] = orders.filter((o) => o.status === col.status);
    }
    return map;
  }, [orders]);

  async function moveOrder(orderId: string, status: string) {
    setBusy(orderId);
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
      setDragId(null);
      setOverCol(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col.status}
          className={`rounded-xl border bg-neutral-50/80 p-3 transition-colors ${
            overCol === col.status ? "border-brand bg-brand/5" : "border-neutral-200"
          }`}
          onDragOver={(e) => {
            if (!canManage) return;
            e.preventDefault();
            setOverCol(col.status);
          }}
          onDragLeave={() => setOverCol((c) => (c === col.status ? null : c))}
          onDrop={(e) => {
            e.preventDefault();
            if (!canManage || !dragId) return;
            void moveOrder(dragId, col.status);
          }}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-600">
              {col.label}
            </h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-neutral-700 ring-1 ring-neutral-200">
              {columns[col.status]?.length ?? 0}
            </span>
          </div>
          <div className="space-y-2 min-h-[120px]">
            {(columns[col.status] ?? []).map((o) => (
              <div
                key={o.id}
                draggable={canManage && !busy}
                onDragStart={() => setDragId(o.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverCol(null);
                }}
                className={`rounded-lg border border-neutral-200 bg-white p-3 shadow-sm transition ${
                  canManage ? "cursor-grab active:cursor-grabbing" : ""
                } ${busy === o.id ? "opacity-50" : ""} ${dragId === o.id ? "ring-2 ring-brand/30" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-bold text-neutral-950 hover:text-brand"
                  >
                    {o.orderNumber}
                  </Link>
                  <StatusBadge status={o.status} />
                </div>
                <p className="mt-1 truncate text-xs text-neutral-500">{o.customerName}</p>
                <p className="mt-2 text-sm font-semibold tabular-nums">
                  {formatCurrency(o.total, o.currency)}
                </p>
                {canManage && (
                  <p className="mt-2 text-[10px] text-neutral-400">Drag to another column to update</p>
                )}
              </div>
            ))}
            {(columns[col.status] ?? []).length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-neutral-400">Drop orders here</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

