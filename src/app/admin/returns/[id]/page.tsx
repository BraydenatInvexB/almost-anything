import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Package } from "lucide-react";
import { getCurrentStaff, listStaff } from "@/services/admin-service";
import { getReturn } from "@/lib/admin/operations-store";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { ReturnDetailActions } from "@/components/admin/ReturnDetailActions";
import { ReturnOperationsPanel } from "@/components/admin/ReturnOperationsPanel";
import {
  PageHeader,
  Panel,
  StatusBadge,
  DetailGrid,
  DetailItem,
  BtnSecondary,
  Timeline,
} from "@/components/admin/ui";
import { formatReturnAge, returnReasonLabel, RETURN_METHODS } from "@/lib/returns/returns";
import { formatCurrency } from "@/lib/utils/cn";

export default async function AdminReturnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.view")) return <AccessDenied feature="returns" />;

  const { id } = await params;
  const [ret, agents] = await Promise.all([
    Promise.resolve(getReturn(id)),
    listStaff(),
  ]);
  if (!ret) notFound();

  const canManage = staffCan(staff, "returns.manage");
  const methodLabel =
    RETURN_METHODS.find((m) => m.value === ret.method)?.label ?? ret.method.replace(/_/g, " ");

  const timeline = [
    ret.createdAt && { label: "Return requested", at: ret.createdAt },
    ret.approvedAt && { label: "Approved", at: ret.approvedAt },
    ret.receivedAt && { label: "Items received", at: ret.receivedAt },
    ret.resolvedAt && {
      label: ret.status === "rejected" ? "Rejected" : "Refund processed",
      at: ret.resolvedAt,
    },
  ].filter(Boolean) as { label: string; at: string }[];

  return (
    <>
      <PageHeader
        title={ret.rmaNumber}
        subtitle={`${ret.orderNumber} · ${returnReasonLabel(ret.reasonCode)} · opened ${formatReturnAge(ret.createdAt)}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Returns", href: "/admin/returns" },
          { label: ret.rmaNumber },
        ]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={ret.status} />
            <BtnSecondary href={`/admin/orders/${ret.orderId}`}>View order</BtnSecondary>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Return details">
            <div className="space-y-4 p-5">
              <p className="text-sm leading-relaxed text-neutral-700">{ret.reason}</p>
              {ret.rejectionReason && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  Rejection reason: {ret.rejectionReason}
                </p>
              )}
              <DetailGrid>
                <DetailItem label="Return method">{methodLabel}</DetailItem>
                <DetailItem label="Restock on receipt">
                  {ret.restockItems ? "Yes" : "No"}
                </DetailItem>
                <DetailItem label="Refund amount">
                  {formatCurrency(ret.refundAmount, ret.currency)}
                </DetailItem>
              </DetailGrid>
            </div>
          </Panel>

          <Panel title="Items being returned">
            <ul className="divide-y divide-neutral-100">
              {ret.items.map((item) => (
                <li key={item.orderItemId} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                      <Package className="h-5 w-5 text-neutral-400" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-neutral-500">
                        Return qty {item.returnQuantity} of {item.quantity}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold tabular-nums">
                    {formatCurrency(item.unitPrice * item.returnQuantity, ret.currency)}
                  </p>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="Activity & notes">
            <div className="space-y-3 p-5">
              {ret.notes.length === 0 ? (
                <p className="text-sm text-neutral-400">No notes yet.</p>
              ) : (
                ret.notes.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg px-4 py-3 text-sm ${
                      n.isInternal ? "bg-amber-50 text-amber-950" : "bg-neutral-50 text-neutral-800"
                    }`}
                  >
                    <p className="text-xs font-semibold text-neutral-500">
                      {n.authorName} · {n.authorType}
                      {n.isInternal ? " · internal" : ""} ·{" "}
                      {new Date(n.createdAt).toLocaleString("en-ZA", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="mt-1">{n.body}</p>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Return settings">
            <div className="p-5">
              <ReturnOperationsPanel ret={ret} agents={agents} canManage={canManage} />
            </div>
          </Panel>

          <Panel title="Workflow & communication">
            <div className="p-5">
              <ReturnDetailActions ret={ret} canManage={canManage} />
            </div>
          </Panel>

          <Panel title="Customer">
            <div className="space-y-3 p-5">
              <DetailGrid>
                <DetailItem label="Name">{ret.customerName}</DetailItem>
                <DetailItem label="Email">
                  <Link
                    href={`mailto:${ret.customerEmail}`}
                    className="inline-flex items-center gap-1 text-brand hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {ret.customerEmail}
                  </Link>
                </DetailItem>
              </DetailGrid>
            </div>
          </Panel>

          <Panel title="Timeline">
            <div className="p-5">
              <Timeline events={timeline} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
