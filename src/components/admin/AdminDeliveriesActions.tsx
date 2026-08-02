"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DeliveryJobStatus } from "@/lib/delivery/types";

export function AdminDeliveriesActions({
  jobId,
  status,
}: {
  jobId: string;
  status: DeliveryJobStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: DeliveryJobStatus) {
    setBusy(true);
    try {
      await fetch("/api/admin/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "delivered" || status === "cancelled") {
    return <p className="text-xs font-medium text-neutral-400">Done</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "awaiting_seller" || status === "ready_for_driver" || status === "assigned" || status === "collecting" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void setStatus("out_for_delivery")}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
        >
          Mark on the way
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void setStatus("delivered")}
        className="rounded-lg border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
      >
        Mark delivered
      </button>
    </div>
  );
}
