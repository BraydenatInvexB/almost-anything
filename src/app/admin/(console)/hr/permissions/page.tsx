import { getCurrentStaff, listStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { HRSubnav, PermissionsMatrix } from "@/components/admin/PermissionsMatrix";

export default async function HRPermissionsPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "hr.view")) return <AccessDenied feature="HR access control" />;

  const allStaff = await listStaff();
  const canManage = staffCan(staff, "hr.manage") || staffCan(staff, "staff.manage");

  return (
    <>
      <PageHeader
        title="Access control"
        subtitle="Define which admin modules each employee can view and operate — by role, with custom grants and blocks."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "HR", href: "/admin/hr" },
          { label: "Access control" },
        ]}
      />
      <HRSubnav active="permissions" />
      <PermissionsMatrix staff={allStaff} canManage={canManage} />
    </>
  );
}
