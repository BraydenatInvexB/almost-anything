"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DriverStatus } from "@/lib/delivery/types";

export function AdminDriversActions({
  driverId,
  status,
}: {
  driverId: string;
  status: DriverStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next: DriverStatus) {
    setBusy(true);
    try {
      await fetch("/api/admin/drivers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: driverId, status: next }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "active" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void setStatus("active")}
          className="rounded-lg border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          Approve
        </button>
      ) : null}
      {status === "active" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void setStatus("suspended")}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          Suspend
        </button>
      ) : null}
      {status === "pending" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void setStatus("rejected")}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
        >
          Reject
        </button>
      ) : null}
    </div>
  );
}
