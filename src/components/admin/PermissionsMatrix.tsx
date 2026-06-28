"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, ChevronRight } from "lucide-react";
import {
  ADMIN_NAV,
  PERMISSION_MODULES,
  ROLE_META,
  staffCan,
} from "@/config/rbac";
import { StaffPermissionsModal } from "@/components/admin/StaffPermissionsModal";
import { cn } from "@/lib/utils/cn";
import type { StaffProfile } from "@/types/staff-access";

/** Nav modules derived from admin sidebar (one column per visible area). */
const MODULE_COLUMNS = PERMISSION_MODULES.map((mod) => ({
  id: mod.id,
  label: mod.label,
  permissions: mod.permissions.map((p) => p.key),
}));

export function PermissionsMatrix({
  staff,
  canManage,
}: {
  staff: StaffProfile[];
  canManage: boolean;
}) {
  const [selected, setSelected] = useState<StaffProfile | null>(null);
  const [members, setMembers] = useState(staff);

  function hasModuleAccess(member: StaffProfile, modulePerms: string[]) {
    return modulePerms.some((p) => staffCan(member, p as Parameters<typeof staffCan>[1]));
  }

  function countActiveModules(member: StaffProfile) {
    return MODULE_COLUMNS.filter((col) => hasModuleAccess(member, col.permissions)).length;
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-neutral-950">Module access matrix</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Each column is an admin area. Green = access via role or custom grant. Red override = blocked.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80">
                <th className="sticky left-0 z-10 bg-neutral-50/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Employee
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Role
                </th>
                {MODULE_COLUMNS.map((col) => (
                  <th
                    key={col.id}
                    className="px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-neutral-500"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {members.map((m) => {
                const extraCount = m.extra_permissions?.length ?? 0;
                const deniedCount = m.denied_permissions?.length ?? 0;
                return (
                  <tr key={m.id} className="hover:bg-neutral-50/60">
                    <td className="sticky left-0 z-10 bg-white px-4 py-3">
                      <p className="font-medium text-neutral-900">{m.full_name}</p>
                      <p className="text-xs text-neutral-400">{m.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          ROLE_META[m.role].accent,
                        )}
                      >
                        {ROLE_META[m.role].label}
                      </span>
                      {(extraCount > 0 || deniedCount > 0) && (
                        <p className="mt-1 text-[10px] text-neutral-400">
                          {extraCount > 0 && `+${extraCount} granted`}
                          {extraCount > 0 && deniedCount > 0 && " · "}
                          {deniedCount > 0 && `−${deniedCount} blocked`}
                        </p>
                      )}
                    </td>
                    {MODULE_COLUMNS.map((col) => {
                      const active = hasModuleAccess(m, col.permissions);
                      return (
                        <td key={col.id} className="px-2 py-3 text-center">
                          <span
                            className={cn(
                              "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                              active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-neutral-100 text-neutral-300",
                            )}
                            title={active ? "Has access" : "No access"}
                          >
                            {active ? "✓" : "—"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right">
                      {canManage && m.role !== "super_admin" ? (
                        <button
                          type="button"
                          onClick={() => setSelected(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          <Shield className="h-3 w-3" />
                          Edit
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          {countActiveModules(m)} modules
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-950">How access works</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li>
              <strong className="text-neutral-800">Base role</strong> — each role has default modules (Support sees support, not finance).
            </li>
            <li>
              <strong className="text-neutral-800">Grant</strong> — add a module the role does not normally include.
            </li>
            <li>
              <strong className="text-neutral-800">Block</strong> — hide a module even if the role includes it.
            </li>
            <li>Changes apply to sidebar navigation, page access, and API permissions.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-950">Admin modules ({ADMIN_NAV.length})</h3>
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm">
            {ADMIN_NAV.map((item) => (
              <li key={item.href} className="flex items-center justify-between text-neutral-600">
                <span>{item.label}</span>
                <span className="font-mono text-[10px] text-neutral-400">{item.permission}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selected && (
        <StaffPermissionsModal
          member={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setMembers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            setSelected(null);
          }}
        />
      )}
    </>
  );
}

export function HRSubnav({ active }: { active: "directory" | "permissions" }) {
  return (
    <nav className="mb-6 flex gap-1 rounded-xl border border-neutral-200 bg-white p-1">
      <Link
        href="/admin/hr"
        className={cn(
          "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          active === "directory" ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-50",
        )}
      >
        Employee directory
      </Link>
      <Link
        href="/admin/hr/permissions"
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          active === "permissions" ? "bg-neutral-950 text-white" : "text-neutral-600 hover:bg-neutral-50",
        )}
      >
        Access control
        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
      </Link>
    </nav>
  );
}
