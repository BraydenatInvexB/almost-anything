"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, X } from "lucide-react";
import {
  PERMISSION_MODULES,
  ROLE_META,
  getEffectivePermissions,
  getRolePermissions,
  type Permission,
} from "@/config/rbac";
import { cn } from "@/lib/utils/cn";
import type { StaffProfile } from "@/types/staff-access";

export function StaffPermissionsModal({
  member,
  onClose,
  onSaved,
}: {
  member: StaffProfile;
  onClose: () => void;
  onSaved: (updated: StaffProfile) => void;
}) {
  const router = useRouter();
  const rolePerms = new Set(getRolePermissions(member.role));
  const [extra, setExtra] = useState<Permission[]>(member.extra_permissions ?? []);
  const [denied, setDenied] = useState<Permission[]>(member.denied_permissions ?? []);
  const [saving, setSaving] = useState(false);

  function toggleExtra(perm: Permission) {
    setExtra((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev.filter((p) => p !== perm), perm],
    );
    setDenied((prev) => prev.filter((p) => p !== perm));
  }

  function toggleDeny(perm: Permission) {
    setDenied((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev.filter((p) => p !== perm), perm],
    );
    setExtra((prev) => prev.filter((p) => p !== perm));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          extra_permissions: extra,
          denied_permissions: denied,
        }),
      });
      const json = await res.json();
      onSaved({
        ...member,
        extra_permissions: extra,
        denied_permissions: denied,
      });
      router.refresh();
      onClose();
    } catch {
      setSaving(false);
    }
  }

  const preview: StaffProfile = { ...member, extra_permissions: extra, denied_permissions: denied };
  const effective = getEffectivePermissions(preview);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold text-neutral-950">
              <Shield className="h-5 w-5 text-brand" />
              Module access · {member.full_name}
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Base role: <span className="font-medium">{ROLE_META[member.role].label}</span>
              {" · "}
              {effective.length} modules active
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-neutral-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="mb-4 text-xs text-neutral-500">
            Each module grants view or manage access. Use <strong>Grant</strong> to add access beyond the role.
            Use <strong>Block</strong> to hide a module even if the role normally includes it.
          </p>
          <div className="space-y-5">
            {PERMISSION_MODULES.map((mod) => (
              <div key={mod.id} className="rounded-xl border border-neutral-200">
                <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
                  <p className="text-sm font-semibold text-neutral-900">{mod.label}</p>
                  <p className="text-xs text-neutral-500">{mod.description}</p>
                </div>
                <ul className="divide-y divide-neutral-50">
                  {mod.permissions.map((p) => {
                    const fromRole = rolePerms.has(p.key);
                    const isExtra = extra.includes(p.key);
                    const isDenied = denied.includes(p.key);
                    const active = (fromRole || isExtra) && !isDenied;
                    return (
                      <li key={p.key} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{p.label}</p>
                          <p className="font-mono text-[10px] text-neutral-400">{p.key}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              active ? "bg-emerald-100 text-emerald-800" : "bg-neutral-100 text-neutral-500",
                            )}
                          >
                            {active ? "Active" : "Hidden"}
                          </span>
                          {!fromRole && (
                            <button
                              type="button"
                              onClick={() => toggleExtra(p.key)}
                              className={cn(
                                "rounded-lg px-2 py-1 text-xs font-semibold",
                                isExtra ? "bg-brand text-white" : "border border-neutral-200 text-neutral-600",
                              )}
                            >
                              Grant
                            </button>
                          )}
                          {(fromRole || isExtra) && (
                            <button
                              type="button"
                              onClick={() => toggleDeny(p.key)}
                              className={cn(
                                "rounded-lg px-2 py-1 text-xs font-semibold",
                                isDenied ? "bg-red-600 text-white" : "border border-neutral-200 text-neutral-600",
                              )}
                            >
                              Block
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-neutral-100 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save access
          </button>
        </div>
      </div>
    </div>
  );
}
