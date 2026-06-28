import { Suspense } from "react";
import { getCurrentStaff, getFinanceDashboard, listStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { FinanceDashboard } from "@/components/admin/FinanceDashboard";

export default async function AdminFinancePage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "finance.view")) return <AccessDenied feature="finance" />;

  const data = await getFinanceDashboard();
  const agents = await listStaff();

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
      <Suspense fallback={<div className="h-32 animate-pulse rounded-xl bg-neutral-100" />}>
        <FinanceDashboard
          data={data}
          canManage={staffCan(staff, "finance.manage")}
          canManageReturns={staffCan(staff, "returns.manage")}
          agents={agents}
        />
      </Suspense>
    </>
  );
}
