"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { StaffProfile } from "@/types/staff-access";
import type { SupportTicket } from "@/types/database";
import { BtnPrimary } from "@/components/admin/ui";
import { SUPPORT_CATEGORIES } from "@/lib/support/helpdesk";

interface TicketActionsPanelProps {
  ticket: SupportTicket;
  agents: StaffProfile[];
  canManage: boolean;
}

export function TicketActionsPanel({ ticket, agents, canManage }: TicketActionsPanelProps) {
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to ?? "");
  const [category, setCategory] = useState(ticket.category);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!canManage) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/support/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          assigned_to: assignedTo || null,
          category,
        }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 p-5">
      <Field label="Status">
        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value as SupportTicket["status"])}
          disabled={!canManage}
        >
          {(["open", "pending", "resolved", "closed"] as const).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Priority">
        <select
          className="input"
          value={priority}
          onChange={(e) => setPriority(e.target.value as SupportTicket["priority"])}
          disabled={!canManage}
        >
          {(["low", "normal", "high", "urgent"] as const).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Category">
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={!canManage}
        >
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Assigned agent">
        <select
          className="input"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          disabled={!canManage}
        >
          <option value="">Unassigned</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.full_name}
            </option>
          ))}
        </select>
      </Field>
      {canManage ? (
        <BtnPrimary type="button" onClick={save} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : saved ? (
            "Saved"
          ) : (
            "Update ticket"
          )}
        </BtnPrimary>
      ) : (
        <p className="rounded-lg bg-neutral-50 px-3 py-2.5 text-xs text-neutral-600">
          You have view-only access to this ticket. Contact a support lead to change status or assignment.
        </p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
