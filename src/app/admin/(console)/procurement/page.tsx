import { getCurrentStaff, listProcurement } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { ProcurementDesk } from "@/components/admin/ProcurementDesk";

export default async function AdminProcurementPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.view")) return <AccessDenied feature="procurement" />;

  const records = await listProcurement();
  const pending = records.filter((r) => r.status === "pending" || r.status === "ordered").length;
  const overseas = records.filter((r) => r.origin === "overseas").length;

  return (
    <>
      <PageHeader
        title="Inbound stock"
        subtitle="Track orders from international warehouse through to your hub — then ship to customers."
      />
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active purchases" value={String(records.length)} accent="bg-neutral-950" />
        <StatCard label="Awaiting action" value={String(pending)} accent="bg-brand" />
        <StatCard label="International warehouse" value={String(overseas)} accent="bg-blue-600" />
        <StatCard label="SA warehouse" value={String(records.filter((r) => r.origin === "sa_warehouse").length)} accent="bg-emerald-600" />
      </div>
      <ProcurementDesk records={records} canManage={staffCan(staff, "procurement.manage")} />
    </>
  );
}
