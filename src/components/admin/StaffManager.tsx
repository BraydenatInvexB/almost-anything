"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Shield, X } from "lucide-react";
import { ROLE_META } from "@/config/rbac";
import { StatusBadge, Table, Th, Td, EmptyState } from "@/components/admin/ui";
import { StaffPermissionsModal } from "@/components/admin/StaffPermissionsModal";
import { cn } from "@/lib/utils/cn";
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

export function StaffManager({
  staff,
  canManage,
}: {
  staff: StaffProfile[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(staff);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [permissionsFor, setPermissionsFor] = useState<StaffProfile | null>(null);

  async function updateMember(id: string, updates: Partial<StaffProfile>) {
    setMembers((m) => m.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    try {
      await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      router.refresh();
    } catch {
      /* demo tolerant */
    }
  }

  return (
    <>
      {canManage && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Invite staff
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white">
        {members.length === 0 ? (
          <EmptyState
            title="No team members yet"
            description={canManage ? "Invite your first team member to get started." : "Team members will appear here once added."}
          />
        ) : (
        <Table>
          <thead>
            <tr className="border-b border-neutral-100">
              <Th>Member</Th>
              <Th>Role</Th>
              <Th>Department</Th>
              <Th>Status</Th>
              <Th>Last active</Th>
              {canManage && <Th>Access</Th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <Td className="min-w-[220px] whitespace-normal">
                  <div className="flex items-center gap-3 py-0.5">
                    {m.avatar_url ? (
                      <Image
                        src={m.avatar_url}
                        alt={m.full_name}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                        {m.full_name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium leading-snug text-neutral-900">{m.full_name}</p>
                      <p className="mt-0.5 truncate text-xs leading-snug text-neutral-500">{m.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  {canManage && m.role !== "super_admin" ? (
                    <select
                      value={m.role}
                      onChange={(e) => updateMember(m.id, { role: e.target.value as StaffRole })}
                      className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium focus:outline-none"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_META[r].label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        ROLE_META[m.role].accent,
                      )}
                    >
                      {ROLE_META[m.role].label}
                    </span>
                  )}
                </Td>
                <Td className="text-neutral-600">{m.title ?? m.department ?? "N/A"}</Td>
                <Td>
                  {canManage && m.role !== "super_admin" ? (
                    <button
                      onClick={() =>
                        updateMember(m.id, {
                          status: m.status === "active" ? "suspended" : "active",
                        })
                      }
                    >
                      <StatusBadge status={m.status} />
                    </button>
                  ) : (
                    <StatusBadge status={m.status} />
                  )}
                </Td>
                <Td className="text-neutral-500">
                  {m.last_active_at
                    ? new Date(m.last_active_at).toLocaleDateString("en-ZA", {
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </Td>
                {canManage && (
                  <Td>
                    {m.role !== "super_admin" ? (
                      <button
                        type="button"
                        onClick={() => setPermissionsFor(m)}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                      >
                        <Shield className="h-3 w-3" />
                        Modules
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400">Full access</span>
                    )}
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        )}
      </div>

      {permissionsFor && (
        <StaffPermissionsModal
          member={permissionsFor}
          onClose={() => setPermissionsFor(null)}
          onSaved={(updated) => {
            setMembers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setPermissionsFor(null);
          }}
        />
      )}

      {inviteOpen && (
        <InviteModal
          onClose={() => setInviteOpen(false)}
          onInvited={(m) => {
            setMembers((prev) => [...prev, m]);
            setInviteOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function InviteModal({
  onClose,
  onInvited,
}: {
  onClose: () => void;
  onInvited: (m: StaffProfile) => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "support_agent" as StaffRole,
    title: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Could not invite staff member");
        setSubmitting(false);
        return;
      }
      onInvited({
        id: json.staff?.id ?? `tmp-${Date.now()}`,
        user_id: null,
        email: form.email,
        full_name: form.full_name,
        role: form.role,
        status: "invited",
        department: null,
        title: form.title || null,
        phone: null,
        avatar_url: null,
        notes: null,
        created_by: null,
        last_active_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        extra_permissions: [],
        denied_permissions: [],
      });
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
          <Field label="Full name">
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Job title">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
            />
          </Field>
          <Field label="Role">
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
          </Field>
          {error && <p className="text-sm text-red-500">{error}</p>}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
