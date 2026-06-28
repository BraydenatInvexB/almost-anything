"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MoreHorizontal } from "lucide-react";
import type { CustomerItemRequest, ItemRequestStatus } from "@/lib/admin/operations-types";
import type { StaffProfile } from "@/types/staff-access";
import { ITEM_REQUEST_STATUSES } from "@/lib/sourcing/requests";

export function ItemRequestRowActions({
  request,
  agents,
  canManage,
}: {
  request: CustomerItemRequest;
  agents: StaffProfile[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<ItemRequestStatus>(request.status);
  const [assignedTo, setAssignedTo] = useState(request.assignedTo ?? "");
  const [quotedAmount, setQuotedAmount] = useState(
    request.quotedAmount != null ? String(request.quotedAmount) : "",
  );
  const [notes, setNotes] = useState(request.internalNotes ?? "");

  async function save() {
    if (!canManage) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          assignedTo: assignedTo || null,
          quotedAmount: quotedAmount ? Number(quotedAmount) : null,
          internalNotes: notes,
        }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!canManage) {
    return <span className="text-xs text-neutral-400">View only</span>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
        aria-label="Manage request"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-72 rounded-xl border border-neutral-200 bg-white p-4 shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Update request
            </p>
            <label className="mt-3 block text-xs font-medium text-neutral-600">
              Status
              <select
                className="input mt-1 w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemRequestStatus)}
              >
                {ITEM_REQUEST_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-neutral-600">
              Assigned to
              <select
                className="input mt-1 w-full"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block text-xs font-medium text-neutral-600">
              Quote amount (ZAR)
              <input
                type="number"
                className="input mt-1 w-full"
                value={quotedAmount}
                onChange={(e) => setQuotedAmount(e.target.value)}
                placeholder="Optional"
              />
            </label>
            <label className="mt-3 block text-xs font-medium text-neutral-600">
              Internal notes
              <textarea
                className="input mt-1 min-h-[72px] w-full"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
          </div>
        </>
      )}
    </div>
  );
}
