import { getCurrentStaff, listProcurement } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { ProcurementPanel } from "@/components/admin/OperationsPanels";

export default async function AdminProcurementPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.view")) return <AccessDenied feature="procurement" />;

  const records = listProcurement();
  const pending = records.filter((r) => r.status === "pending" || r.status === "ordered").length;
  const overseas = records.filter((r) => r.origin === "overseas").length;

  return (
    <>
      <PageHeader title="Procurement" subtitle="Track when the company purchases products on behalf of customers, from SA suppliers or overseas." />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active purchases" value={String(records.length)} accent="bg-neutral-950" />
        <StatCard label="Awaiting action" value={String(pending)} accent="bg-brand" />
        <StatCard label="Overseas orders" value={String(overseas)} accent="bg-violet-600" />
        <StatCard label="SA warehouse" value={String(records.filter((r) => r.origin === "sa_warehouse").length)} accent="bg-emerald-600" />
      </div>
      <ProcurementPanel records={records} canManage={staffCan(staff, "procurement.manage")} />
    </>
  );
}
