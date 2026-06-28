import { getCurrentStaff, getFinanceDashboard } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { FinanceDashboard } from "@/components/admin/FinanceDashboard";

export default async function AdminFinancePage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "finance.view")) return <AccessDenied feature="finance" />;

  const data = await getFinanceDashboard();

  return (
    <>
      <PageHeader
        title="Finance"
        subtitle="Full P&L, revenue, expenses, supplier payables, refunds, courier costs, and VAT for the commerce operation."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Finance" },
        ]}
      />
      <FinanceDashboard data={data} canManage={staffCan(staff, "finance.manage")} />
    </>
  );
}
