"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ReturnRequest } from "@/lib/admin/operations-types";
import { returnStatusLabel } from "@/lib/returns/returns";
import { BtnPrimary, BtnSecondary, StatusBadge } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";

const WORKFLOW: ReturnRequest["status"][] = [
  "requested",
  "approved",
  "received",
  "refunded",
];

export function ReturnDetailActions({
  ret,
  canManage,
}: {
  ret: ReturnRequest;
  canManage: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [refundAmount, setRefundAmount] = useState(String(ret.refundAmount || ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/returns/${ret.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed");
        return;
      }
      setNote("");
      setCustomerMessage("");
      setSuccess("Done — refreshing…");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!canManage) {
    return (
      <p className="text-sm text-neutral-500">
        Current status: <StatusBadge status={ret.status} />
      </p>
    );
  }

  const stepIndex = WORKFLOW.indexOf(ret.status);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase text-neutral-500">Workflow progress</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {WORKFLOW.map((status, i) => (
            <span
              key={status}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                ret.status === status
                  ? "bg-brand text-white"
                  : i < stepIndex
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {returnStatusLabel(status)}
            </span>
          ))}
          {ret.status === "rejected" && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              Rejected
            </span>
          )}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

      {ret.status === "requested" && (
        <div className="flex flex-wrap gap-2">
          <BtnPrimary disabled={busy} onClick={() => patch({ action: "approve" })}>
            Approve return
          </BtnPrimary>
          <BtnSecondary
            disabled={busy}
            onClick={() => patch({ action: "reject", rejectionReason: "Does not meet return policy" })}
          >
            Reject
          </BtnSecondary>
        </div>
      )}

      {ret.status === "approved" && (
        <BtnPrimary disabled={busy} onClick={() => patch({ action: "mark_received" })}>
          Mark items received
        </BtnPrimary>
      )}

      {ret.status === "received" && (
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase text-neutral-500">
            Refund amount ({ret.currency})
          </label>
          <input
            className="input w-full max-w-xs"
            type="number"
            min={0}
            step={0.01}
            value={refundAmount}
            onChange={(e) => setRefundAmount(e.target.value)}
          />
          <BtnPrimary
            disabled={busy}
            onClick={() =>
              patch({
                action: "refund",
                refundAmount: Number(refundAmount) || ret.refundAmount,
              })
            }
          >
            Process refund ({formatCurrency(Number(refundAmount) || ret.refundAmount, ret.currency)})
          </BtnPrimary>
        </div>
      )}

      {(ret.status === "refunded" || ret.status === "rejected") && (
        <p className="text-sm text-neutral-600">
          Closed on{" "}
          {ret.resolvedAt
            ? new Date(ret.resolvedAt).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })
            : "—"}
          .
        </p>
      )}

      <div className="border-t border-neutral-100 pt-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-500">
            Message customer
          </label>
          <textarea
            className="input mt-2 min-h-[72px] w-full"
            placeholder="Your return label has been emailed…"
            value={customerMessage}
            onChange={(e) => setCustomerMessage(e.target.value)}
          />
          <BtnPrimary
            className="mt-2"
            disabled={busy || !customerMessage.trim()}
            onClick={() => patch({ action: "message_customer", message: customerMessage.trim() })}
          >
            Send to customer
          </BtnPrimary>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-500">
            Internal note
          </label>
          <textarea
            className="input mt-2 min-h-[72px] w-full"
            placeholder="Inspection notes, courier reference…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <BtnSecondary
            className="mt-2"
            disabled={busy || !note.trim()}
            onClick={() => patch({ action: "add_note", note: note.trim(), isInternal: true })}
          >
            Save internal note
          </BtnSecondary>
        </div>

        <a
          href={`mailto:${ret.customerEmail}?subject=${encodeURIComponent(`Return ${ret.rmaNumber}`)}`}
          className="inline-flex text-sm font-semibold text-brand hover:underline"
        >
          Email customer directly →
        </a>
      </div>
    </div>
  );
}
