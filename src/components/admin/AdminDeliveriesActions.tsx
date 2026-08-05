"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DeliveryJobStatus } from "@/lib/delivery/types";

export function AdminDeliveriesActions({
  jobId,
  status,
  assignedDriverId,
  drivers,
  assignable,
}: {
  jobId: string;
  status: DeliveryJobStatus;
  assignedDriverId: string | null;
  drivers: { id: string; name: string; province: string }[];
  assignable: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(next: DeliveryJobStatus, driverId?: string | null) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: next, driverId }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) { setError(body.error ?? "Could not update delivery."); return; }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "delivered" || status === "cancelled") {
    return <p className="text-xs font-medium text-neutral-400">{status === "delivered" ? "Proof captured" : "Cancelled"}</p>;
  }

  return (
    <div className="w-full space-y-2 sm:w-72">
      {assignable ? <><label className="block text-[11px] font-bold uppercase tracking-wide text-neutral-500">Assign driver</label>
      <select
        value={assignedDriverId ?? ""}
        disabled={busy || status === "out_for_delivery"}
        onChange={(event) => void update(event.target.value ? "assigned" : "ready_for_driver", event.target.value || null)}
        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
      >
        <option value="">Unassigned</option>
        {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name} · {driver.province}</option>)}
      </select></> : null}
      <div className="flex flex-wrap gap-2">
      {assignedDriverId && (status === "assigned" || status === "collecting") ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void update("out_for_delivery", assignedDriverId)}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
        >
          Mark on the way
        </button>
      ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
