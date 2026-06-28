"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import type { ReturnRequest } from "@/lib/admin/operations-types";
import { formatCurrency } from "@/lib/utils/cn";

function ActionBtn({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger" | "secondary";
}) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand/90",
    danger: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    secondary: "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function ReturnsRowActions({
  ret,
  canManage,
  compact = false,
}: {
  ret: ReturnRequest;
  canManage: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function run(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/returns/${ret.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Action failed");
        return;
      }
      setRejectOpen(false);
      setRejectReason("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!canManage) {
    return (
      <Link
        href={`/admin/returns/${ret.id}`}
        className="text-xs font-semibold text-brand hover:underline"
      >
        View
      </Link>
    );
  }

  if (ret.status === "refunded" || ret.status === "rejected") {
    return (
      <Link
        href={`/admin/returns/${ret.id}`}
        className="text-xs font-semibold text-neutral-500 hover:text-brand"
      >
        View record
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-1.5 ${compact ? "justify-end" : ""}`}>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}

        {ret.status === "requested" && (
          <>
            <ActionBtn disabled={busy} onClick={() => run("approve")}>
              <Check className="h-3.5 w-3.5" />
              Approve
            </ActionBtn>
            <ActionBtn disabled={busy} variant="danger" onClick={() => setRejectOpen((v) => !v)}>
              <X className="h-3.5 w-3.5" />
              Reject
            </ActionBtn>
          </>
        )}

        {ret.status === "approved" && (
          <ActionBtn disabled={busy} onClick={() => run("mark_received")}>
            Mark received
          </ActionBtn>
        )}

        {ret.status === "received" && (
          <ActionBtn
            disabled={busy}
            onClick={() =>
              run("refund", {
                refundAmount: ret.refundAmount || undefined,
              })
            }
          >
            Process refund ({formatCurrency(ret.refundAmount, ret.currency)})
          </ActionBtn>
        )}

        <Link
          href={`/admin/returns/${ret.id}`}
          className="inline-flex h-8 items-center rounded-lg border border-neutral-200 px-3 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
        >
          Open
        </Link>
      </div>

      {rejectOpen && ret.status === "requested" && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50/50 p-2">
          <input
            className="input w-full text-xs"
            placeholder="Rejection reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <ActionBtn
            disabled={busy || !rejectReason.trim()}
            variant="danger"
            onClick={() => run("reject", { rejectionReason: rejectReason.trim() })}
          >
            Confirm reject
          </ActionBtn>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
