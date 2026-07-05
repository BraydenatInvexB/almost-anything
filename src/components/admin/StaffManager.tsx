"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { ROLE_META } from "@/config/rbac";
import { StatusBadge, Table, Th, Td, EmptyState } from "@/components/admin/ui";
import { StaffPermissionsModal } from "@/components/admin/StaffPermissionsModal";
import { StaffInviteModal, STAFF_ROLES } from "@/components/admin/StaffInviteModal";
import { cn } from "@/lib/utils/cn";
import type { StaffProfile } from "@/types/staff-access";
import type { StaffRole } from "@/types/database";

export function StaffManager({
  staff,
  canManage,
  currentStaffId,
  suppressInviteButton = false,
  inviteOpen: inviteOpenProp,
  onInviteOpenChange,
}: {
  staff: StaffProfile[];
  canManage: boolean;
  currentStaffId?: string;
  suppressInviteButton?: boolean;
  inviteOpen?: boolean;
  onInviteOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [members, setMembers] = useState(staff);
  const [inviteOpenInternal, setInviteOpenInternal] = useState(false);
  const [permissionsFor, setPermissionsFor] = useState<StaffProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const inviteOpen = inviteOpenProp ?? inviteOpenInternal;
  const setInviteOpen = onInviteOpenChange ?? setInviteOpenInternal;

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

  async function removeMember(member: StaffProfile) {
    const label = member.full_name || member.email;
    const confirmed = window.confirm(
      `Remove ${label} from staff? They will lose admin access${member.status === "invited" ? " and their pending invitation will be cancelled" : ""}.`,
    );
    if (!confirmed) return;

    setDeletingId(member.id);
    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(member.id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "Could not remove staff member");
        return;
      }
      setMembers((prev) => prev.filter((s) => s.id !== member.id));
      router.refresh();
    } catch {
      alert("Network error while removing staff member");
    } finally {
      setDeletingId(null);
    }
  }

  function canRemoveMember(member: StaffProfile): boolean {
    if (!canManage) return false;
    if (member.role === "super_admin") return false;
    if (currentStaffId && member.id === currentStaffId) return false;
    return true;
  }

  async function resendInvite(member: StaffProfile) {
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: member.email,
          full_name: member.full_name,
          role: member.role,
          title: member.title ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error ?? "Could not resend invitation");
        return;
      }
      if (json.staff) {
        setMembers((prev) => prev.map((s) => (s.id === member.id ? json.staff : s)));
      }
      alert(
        json.emailSent
          ? `Invitation email resent to ${member.email}`
          : `${member.email} is linked to an existing account and can sign in at /admin/login`,
      );
      router.refresh();
    } catch {
      alert("Network error while resending invitation");
    }
  }

  return (
    <>
      {canManage && !suppressInviteButton && (
        <div className="mb-4 flex justify-end px-5 pt-5">
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Invite staff
          </button>
        </div>
      )}

      <div className={cn("border-neutral-200 bg-white", suppressInviteButton ? "" : "rounded-2xl border")}>
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
              {canManage ? <Th className="w-16">Actions</Th> : null}
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
                  <div className="flex flex-col gap-1.5">
                    {canManage && m.role !== "super_admin" ? (
                      <select
                        value={m.role}
                        onChange={(e) => updateMember(m.id, { role: e.target.value as StaffRole })}
                        className="w-full max-w-[180px] rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs font-medium focus:outline-none"
                      >
                        {STAFF_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_META[r].label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={cn(
                          "inline-flex w-fit rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                          ROLE_META[m.role].accent,
                        )}
                      >
                        {ROLE_META[m.role].label}
                      </span>
                    )}
                    {canManage && m.role !== "super_admin" && (
                      <button
                        type="button"
                        onClick={() => setPermissionsFor(m)}
                        className="inline-flex w-fit items-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-neutral-800"
                      >
                        <Shield className="h-3 w-3" />
                        Customise modules
                      </button>
                    )}
                    {canManage && m.status === "invited" && (
                      <button
                        type="button"
                        onClick={() => resendInvite(m)}
                        className="inline-flex w-fit text-[11px] font-semibold text-brand hover:underline"
                      >
                        Resend invitation
                      </button>
                    )}
                  </div>
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
                {canManage ? (
                  <Td>
                    {canRemoveMember(m) ? (
                      <button
                        type="button"
                        onClick={() => removeMember(m)}
                        disabled={deletingId === m.id}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Remove ${m.full_name}`}
                        title="Remove staff member"
                      >
                        {deletingId === m.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}
                  </Td>
                ) : null}
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
        <StaffInviteModal
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
