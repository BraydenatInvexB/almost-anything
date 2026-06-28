import { getCurrentStaff, listStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { ROLE_META } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, Panel, StatCard, StatusBadge, Table, Th, Td } from "@/components/admin/ui";
import { StaffManager } from "@/components/admin/StaffManager";
import { HRSubnav } from "@/components/admin/PermissionsMatrix";
import Link from "next/link";
import { Shield } from "lucide-react";

export default async function AdminHRPage() {
  const staff = await getCurrentStaff();
  if (!staff || !(staffCan(staff, "hr.view") || staffCan(staff, "staff.view"))) {
    return <AccessDenied feature="HR & staff" role={staff?.role} />;
  }

  const allStaff = await listStaff();
  const active = allStaff.filter((s) => s.status === "active").length;
  const departments = [...new Set(allStaff.map((s) => s.department).filter(Boolean))];

  return (
    <>
      <PageHeader
        title="Human Resources"
        subtitle="Manage employees, departments, roles, responsibilities, and access across the platform."
        action={
          staffCan(staff, "hr.manage") || staffCan(staff, "staff.manage") ? (
            <Link
              href="/admin/hr/permissions"
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              <Shield className="h-4 w-4" />
              Access control
            </Link>
          ) : undefined
        }
      />
      <HRSubnav active="directory" />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total employees" value={String(allStaff.length)} accent="bg-neutral-950" />
        <StatCard label="Active" value={String(active)} accent="bg-brand" />
        <StatCard label="Departments" value={String(departments.length)} accent="bg-violet-600" />
        <StatCard label="Roles in use" value={String(new Set(allStaff.map((s) => s.role)).size)} accent="bg-emerald-600" />
      </div>

      <Panel title="Department overview" className="mb-4">
        <Table>
          <thead><tr><Th>Department</Th><Th>Headcount</Th><Th>Roles</Th></tr></thead>
          <tbody className="divide-y divide-neutral-50">
            {departments.map((dept) => {
              const members = allStaff.filter((s) => s.department === dept);
              return (
                <tr key={dept}>
                  <Td className="font-semibold">{dept}</Td>
                  <Td>{members.length}</Td>
                  <Td className="text-neutral-600">{[...new Set(members.map((m) => ROLE_META[m.role].label))].join(", ")}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>

      <Panel title="Employee directory">
        <StaffManager staff={allStaff} canManage={staffCan(staff, "hr.manage") || staffCan(staff, "staff.manage")} />
      </Panel>
    </>
  );
}
