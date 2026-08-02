"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DeliveryJobStatus } from "@/lib/delivery/types";

export function SellerDeliveryActions({
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
      await fetch("/api/seller/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "delivered" || status === "cancelled") return null;

  return (
    <div className="flex flex-wrap gap-2">
      {status === "awaiting_seller" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void setStatus("out_for_delivery")}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          Out for delivery
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
