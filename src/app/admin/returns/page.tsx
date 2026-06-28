import { getCurrentStaff, listReturns } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { ReturnsPanel } from "@/components/admin/OperationsPanels";

export default async function AdminReturnsPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.view")) return <AccessDenied feature="returns" />;

  return (
    <>
      <PageHeader title="Returns & refunds" subtitle="Process customer return requests and issue refunds. Refunds auto-record in finance." />
      <ReturnsPanel returns={listReturns()} canManage={staffCan(staff, "returns.manage")} />
    </>
  );
}
