"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ReturnRequest, ReturnStatus } from "@/lib/admin/operations-types";
import type { StaffProfile } from "@/types/staff-access";
import { RETURN_METHODS, RETURN_REASONS, returnStatusLabel } from "@/lib/returns/returns";
import { BtnPrimary } from "@/components/admin/ui";

const STATUSES: ReturnStatus[] = ["requested", "approved", "received", "refunded", "rejected"];

export function ReturnOperationsPanel({
  ret,
  agents,
  canManage,
}: {
  ret: ReturnRequest;
  agents: StaffProfile[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(ret.status);
  const [reasonCode, setReasonCode] = useState(ret.reasonCode);
  const [reason, setReason] = useState(ret.reason);
  const [method, setMethod] = useState(ret.method);
  const [refundAmount, setRefundAmount] = useState(String(ret.refundAmount || ""));
  const [restockItems, setRestockItems] = useState(ret.restockItems);
  const [assignedTo, setAssignedTo] = useState(ret.assignedTo ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(ret.status);
    setReasonCode(ret.reasonCode);
    setReason(ret.reason);
    setMethod(ret.method);
    setRefundAmount(String(ret.refundAmount || ""));
    setRestockItems(ret.restockItems);
    setAssignedTo(ret.assignedTo ?? "");
  }, [ret]);

  async function save() {
    if (!canManage) return;
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const res = await fetch(`/api/admin/returns/${ret.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          status,
          reasonCode,
          reason: reason.trim(),
          method,
          refundAmount: Number(refundAmount) || 0,
          restockItems,
          assignedTo: assignedTo || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save changes");
        return;
      }
      setSaved(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <dl className="space-y-3 text-sm">
        <Row label="Status" value={returnStatusLabel(ret.status)} />
        <Row label="Assigned" value={agents.find((a) => a.id === ret.assignedTo)?.full_name ?? "Unassigned"} />
        <Row label="Refund" value={`${ret.currency} ${ret.refundAmount.toFixed(2)}`} />
      </dl>
    );
  }

  return (
    <div className="space-y-3">
      <Field label="Status">
        <select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value as ReturnStatus)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{returnStatusLabel(s)}</option>
          ))}
        </select>
      </Field>

      <Field label="Assigned to">
        <select className="input w-full" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.full_name}</option>
          ))}
        </select>
      </Field>

      <Field label="Reason category">
        <select className="input w-full" value={reasonCode} onChange={(e) => setReasonCode(e.target.value as ReturnRequest["reasonCode"])}>
          {RETURN_REASONS.map((r) => (
            <option key={r.code} value={r.code}>{r.label}</option>
          ))}
        </select>
      </Field>

      <Field label="Return method">
        <select className="input w-full" value={method} onChange={(e) => setMethod(e.target.value as ReturnRequest["method"])}>
          {RETURN_METHODS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </Field>

      <Field label={`Refund amount (${ret.currency})`}>
        <input
          type="number"
          min={0}
          step={0.01}
          className="input w-full"
          value={refundAmount}
          onChange={(e) => setRefundAmount(e.target.value)}
        />
      </Field>

      <Field label="Details">
        <textarea className="input min-h-[72px] w-full" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={restockItems}
          onChange={(e) => setRestockItems(e.target.checked)}
          className="rounded border-neutral-300"
        />
        Restock items when received
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <BtnPrimary type="button" onClick={save} disabled={saving} className="w-full">
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : saved ? (
          "Saved"
        ) : (
          "Save changes"
        )}
      </BtnPrimary>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
