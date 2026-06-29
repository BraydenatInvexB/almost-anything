import { getCurrentStaff, getReportsSummary, listAdminOrders } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { ReportsConsole } from "@/components/admin/ReportsConsole";

export default async function AdminReportsPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "dashboard.view")) {
    return <AccessDenied feature="reports" />;
  }

  const [reports, orders] = await Promise.all([getReportsSummary(), listAdminOrders()]);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Filter by date range, export order data, and review operational health."
      />
      <ReportsConsole reports={reports} orders={orders} />
    </>
  );
}
