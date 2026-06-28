import { getCurrentStaff, listStaff } from "@/services/admin-service";
import { can, ROLE_META } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { StaffManager } from "@/components/admin/StaffManager";
import type { StaffRole } from "@/types/database";

export default async function AdminStaffPage() {
  const staff = await getCurrentStaff();
  if (!staff || !can(staff.role, "staff.view")) return <AccessDenied feature="staff management" />;

  const members = await listStaff();
  const canManage = can(staff.role, "staff.manage");

  const active = members.filter((m) => m.status === "active").length;
  const departments = new Set(members.map((m) => m.department).filter(Boolean)).size;
  const roleCounts = members.reduce<Record<string, number>>((acc, m) => {
    acc[m.role] = (acc[m.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Staff & Roles"
        subtitle="Build your team. Assign roles, departments, and the exact access each person needs."
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Team members" value={String(members.length)} />
        <StatCard label="Active" value={String(active)} />
        <StatCard label="Departments" value={String(departments)} />
        <StatCard label="Roles in use" value={String(Object.keys(roleCounts).length)} />
      </div>

      {/* Role legend */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(ROLE_META) as StaffRole[]).map((role) => (
          <div key={role} className="rounded-2xl border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ROLE_META[role].accent}`}
              >
                {ROLE_META[role].label}
              </span>
              <span className="text-xs font-semibold text-neutral-400">
                {roleCounts[role] ?? 0}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">
              {ROLE_META[role].description}
            </p>
          </div>
        ))}
      </div>

      <StaffManager staff={members} canManage={canManage} />
    </>
  );
}
