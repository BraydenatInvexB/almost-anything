"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import type { DeliveryJobStatus } from "@/lib/delivery/types";

export function DriverJobActions({
  jobId,
  status,
  canClaim,
}: {
  jobId: string;
  status: DeliveryJobStatus;
  canClaim?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/driver/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (status === "delivered" || status === "cancelled") return null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {canClaim && status === "ready_for_driver" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run({ action: "claim", id: jobId })}
            className="rounded-lg border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Claim job
          </button>
        ) : null}
        {status === "assigned" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run({ action: "status", id: jobId, status: "collecting" })}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Start collecting
          </button>
        ) : null}
        {status === "collecting" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run({ action: "status", id: jobId, status: "out_for_delivery" })}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
          >
            Out for delivery
          </button>
        ) : null}
        {status === "assigned" || status === "collecting" || status === "out_for_delivery" ? (
          <Link
            href={`/driver/jobs/${jobId}`}
            className="rounded-lg border border-black bg-black px-3 py-1.5 text-xs font-semibold text-white"
          >
            Open delivery
          </Link>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
