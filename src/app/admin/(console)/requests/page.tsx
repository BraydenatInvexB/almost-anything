import { getCurrentStaff, listStaff } from "@/services/admin-service";
import { listAllItemRequests } from "@/services/sourcing-request-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { SourcingRequestsDesk } from "@/components/admin/SourcingRequestsDesk";

export default async function AdminItemRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.view")) {
    return <AccessDenied feature="item requests" role={staff?.role} />;
  }

  const { status = "all", q = "" } = await searchParams;
  const [requests, agents] = await Promise.all([
    Promise.resolve(listAllItemRequests()),
    listStaff(),
  ]);

  return (
    <>
      <PageHeader
        title="Item requests"
        subtitle="Customer sourcing requests from the storefront — search, quote, and fulfil."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Item requests" },
        ]}
      />
      <SourcingRequestsDesk
        requests={requests}
        canManage={staffCan(staff, "procurement.manage")}
        agents={agents}
        initialStatus={status}
        initialQuery={q}
      />
    </>
  );
}
