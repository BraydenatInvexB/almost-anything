"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import type { StaffProfile } from "@/types/staff-access";
import { ROLE_META } from "@/config/rbac";

export function DemoStaffSwitcher({
  staff,
  allStaff,
}: {
  staff: StaffProfile;
  allStaff: StaffProfile[];
}) {
  const router = useRouter();

  async function switchTo(id: string) {
    await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: id }),
    });
    router.refresh();
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <Users className="h-4 w-4 shrink-0" />
      <span className="font-medium">Demo: preview as another employee</span>
      <select
        value={staff.id}
        onChange={(e) => switchTo(e.target.value)}
        className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium"
      >
        {allStaff.filter((s) => s.status === "active" || s.status === "invited").map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name} · {ROLE_META[s.role].label}
          </option>
        ))}
      </select>
      <span className="text-xs text-amber-700">Nav and pages respect role + custom module access.</span>
    </div>
  );
}
