import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentStaff, listStaff } from "@/services/admin-service";
import { getItemRequest } from "@/lib/admin/operations-persistence";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { ItemRequestRowActions } from "@/components/admin/ItemRequestRowActions";
import { PageHeader, Panel, StatusBadge, DetailGrid, DetailItem } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { itemRequestStatusLabel } from "@/lib/sourcing/requests";

export default async function AdminItemRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.view")) {
    return <AccessDenied feature="item requests" />;
  }

  const { id } = await params;
  const request = await getItemRequest(id);
  if (!request) notFound();

  const agents = await listStaff();
  const canManage = staffCan(staff, "procurement.manage");

  return (
    <>
      <PageHeader
        title={request.requestNumber}
        subtitle={request.query}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Item requests", href: "/admin/requests" },
          { label: request.requestNumber },
        ]}
        action={<StatusBadge status={request.status} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Customer request">
            <div className="p-5">
              <p className="text-lg font-semibold text-neutral-950">{request.query}</p>
              {request.internalNotes && (
                <p className="mt-4 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
                  {request.internalNotes}
                </p>
              )}
            </div>
          </Panel>

          {canManage && (
            <Panel title="Manage request">
              <div className="p-5">
                <ItemRequestRowActions request={request} agents={agents} canManage={canManage} />
              </div>
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Customer">
            <div className="p-5">
              <DetailGrid>
                <DetailItem label="Email">
                  {request.customerEmail ? (
                    <Link
                      href={`mailto:${request.customerEmail}`}
                      className="text-brand hover:underline"
                    >
                      {request.customerEmail}
                    </Link>
                  ) : (
                    "—"
                  )}
                </DetailItem>
                <DetailItem label="Budget">
                  {request.budget
                    ? formatCurrency(request.budget, request.currency)
                    : "Not specified"}
                </DetailItem>
                <DetailItem label="Urgency">{request.urgency}</DetailItem>
                <DetailItem label="Status">{itemRequestStatusLabel(request.status)}</DetailItem>
                {request.quotedAmount != null && (
                  <DetailItem label="Quoted">
                    {formatCurrency(request.quotedAmount, request.currency)}
                  </DetailItem>
                )}
              </DetailGrid>
            </div>
          </Panel>

          <Panel title="Timeline">
            <div className="space-y-2 p-5 text-sm text-neutral-600">
              <p>Created {new Date(request.createdAt).toLocaleString("en-ZA")}</p>
              <p>Updated {new Date(request.updatedAt).toLocaleString("en-ZA")}</p>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
