import { getCurrentStaff, listStaff } from "@/services/admin-service";
import { listAllReturns } from "@/services/return-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { ReturnsDesk } from "@/components/admin/ReturnsDesk";

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.view")) return <AccessDenied feature="returns" role={staff?.role} />;

  const { status = "all", q = "" } = await searchParams;
  const [returns, agents] = await Promise.all([Promise.resolve(listAllReturns()), listStaff()]);

  return (
    <>
      <PageHeader
        title="Returns & refunds"
        subtitle="Create RMAs, assign staff, edit refund amounts, and run the full return lifecycle."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Returns" },
        ]}
      />
      <ReturnsDesk
        returns={returns}
        canManage={staffCan(staff, "returns.manage")}
        agents={agents}
        initialStatus={status}
        initialQuery={q}
      />
    </>
  );
}
