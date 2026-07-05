"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { ROLE_META } from "@/config/rbac";
import type { StaffProfile } from "@/types/staff-access";
import type { StaffRole } from "@/types/database";

const ROLES: StaffRole[] = [
  "super_admin",
  "admin",
  "manager",
  "finance",
  "hr",
  "support_agent",
  "marketing",
  "fulfillment",
  "analyst",
];

export function StaffInviteModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: (m: StaffProfile) => void;
}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "support_agent" as StaffRole,
    title: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          full_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not invite staff member");
        setSubmitting(false);
        return;
      }
      const profile = json.staff as StaffProfile | undefined;
      const message = json.emailSent
        ? `Invitation email sent to ${form.email.trim().toLowerCase()}. They can set a password from the email, then sign in at /admin/login.`
        : `Staff access granted for ${form.email.trim().toLowerCase()}. They already have an account and can sign in at /admin/login.`;
      setSuccess(message);
      const invited =
        profile ?? {
          id: `tmp-${Date.now()}`,
          user_id: null,
          email: form.email.trim().toLowerCase(),
          full_name: `${form.first_name.trim()} ${form.last_name.trim()}`.trim(),
          role: form.role,
          status: json.emailSent ? ("invited" as const) : ("active" as const),
          department: form.title.trim() || null,
          title: form.title.trim() || null,
          phone: null,
          avatar_url: null,
          notes: null,
          created_by: null,
          last_active_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          extra_permissions: [],
          denied_permissions: [],
        };
      window.setTimeout(() => onInvited(invited), 1400);
      setSubmitting(false);
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Invite a staff member</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-neutral-400" />
          </button>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <StaffInviteField label="First name">
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="input"
              />
            </StaffInviteField>
            <StaffInviteField label="Last name">
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="input"
              />
            </StaffInviteField>
          </div>
          <StaffInviteField label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
          </StaffInviteField>
          <StaffInviteField label="Job title">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
            />
          </StaffInviteField>
          <StaffInviteField label="Role">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
              className="input"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_META[r].label}: {ROLE_META[r].description}
                </option>
              ))}
            </select>
          </StaffInviteField>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Send invitation
          </button>
        </form>
      </div>
    </div>
  );
}

function StaffInviteField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      {children}
    </label>
  );
}

export { ROLES as STAFF_ROLES };
