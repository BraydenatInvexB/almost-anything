"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ReturnRequest, ReturnStatus } from "@/lib/admin/operations-types";
import type { StaffProfile } from "@/types/staff-access";
import {
  computeReturnMetrics,
  formatReturnAge,
  returnReasonLabel,
  sortReturnsForQueue,
} from "@/lib/returns/returns";
import {
  EmptyState,
  Panel,
  StatCard,
  StatusBadge,
  Table,
  Td,
  Th,
  BtnPrimary,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { ReturnsRowActions } from "@/components/admin/ReturnsRowActions";
import { CreateReturnModal } from "@/components/admin/CreateReturnModal";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";

const STATUS_FILTERS: { value: ReturnStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "received", label: "Received" },
  { value: "refunded", label: "Refunded" },
  { value: "rejected", label: "Rejected" },
];

function ReturnsFilters({ status, query }: { status: string; query: string }) {
  return (
    <form className="flex flex-wrap items-center gap-3" method="get">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search RMA, order, customer…"
          className="input w-full pl-9"
        />
      </div>
      <select name="status" defaultValue={status} className="input w-40">
        {STATUS_FILTERS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
      <button type="submit" className="btn-secondary h-9 rounded-lg px-4 text-sm font-semibold">
        Filter
      </button>
    </form>
  );
}

export function ReturnsDesk({
  returns,
  canManage,
  agents = [],
  initialStatus = "all",
  initialQuery = "",
  embedded = false,
}: {
  returns: ReturnRequest[];
  canManage: boolean;
  agents?: StaffProfile[];
  initialStatus?: string;
  initialQuery?: string;
  /** Hide dashboard stats — used inside Finance → Refunds tab */
  embedded?: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const metrics = computeReturnMetrics(returns);
  const query = initialQuery.trim().toLowerCase();
  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a.full_name]));

  let filtered = returns;
  if (initialStatus !== "all") filtered = filtered.filter((r) => r.status === initialStatus);
  if (query) {
    filtered = filtered.filter(
      (r) =>
        r.rmaNumber.toLowerCase().includes(query) ||
        r.orderNumber.toLowerCase().includes(query) ||
        r.customerName.toLowerCase().includes(query) ||
        r.customerEmail.toLowerCase().includes(query) ||
        r.reason.toLowerCase().includes(query),
    );
  }

  const queue = sortReturnsForQueue(filtered);

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="New requests" value={String(metrics.open)} icon={<Clock className="h-4 w-4" />} accent="bg-amber-600" hint="Awaiting review" />
          <StatCard label="Awaiting receipt" value={String(metrics.awaitingReceipt)} icon={<Truck className="h-4 w-4" />} accent="bg-blue-600" hint="Label sent" />
          <StatCard label="Ready to refund" value={String(metrics.pendingRefund)} icon={<Package className="h-4 w-4" />} accent="bg-violet-600" hint="Items received" />
          <StatCard label="Refunded this month" value={String(metrics.refundedThisMonth)} icon={<CheckCircle2 className="h-4 w-4" />} accent="bg-emerald-600" />
          <StatCard label="Rejected" value={String(metrics.rejected)} icon={<XCircle className="h-4 w-4" />} accent="bg-red-600" />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!embedded ? (
          <ReturnsFilters status={initialStatus} query={initialQuery} />
        ) : (
          <p className="text-sm text-neutral-500">
            {queue.length} return{queue.length === 1 ? "" : "s"} in queue
          </p>
        )}
        {canManage && (
          <BtnPrimary type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create RMA
          </BtnPrimary>
        )}
      </div>

      {createOpen && <CreateReturnModal onClose={() => setCreateOpen(false)} />}

      <Panel
        title={embedded ? "Return & refund queue" : "Return queue"}
        description="Full control: approve, receive, refund, assign, and edit any return from the list or detail page."
      >
        {queue.length === 0 ? (
          <EmptyState
            title="No returns match your filters"
            description={canManage ? "Create an RMA or wait for customer requests." : "Adjust filters or wait for customer return requests."}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>RMA</Th>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Reason</Th>
                <Th>Status</Th>
                <Th className="text-right">Refund</Th>
                {agents.length > 0 && <Th>Assigned</Th>}
                <Th>Age</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {queue.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
                  <Td className="whitespace-nowrap">
                    <Link href={`/admin/returns/${r.id}`} className="font-mono text-sm font-semibold text-brand hover:underline">
                      {r.rmaNumber}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap">
                    <Link href={`/admin/orders/${r.orderId}`} className="font-semibold hover:text-brand">
                      {r.orderNumber}
                    </Link>
                  </Td>
                  <Td className="min-w-[160px] whitespace-normal">
                    <p className="font-medium">{r.customerName}</p>
                    <p className="text-xs text-neutral-400">{r.customerEmail}</p>
                  </Td>
                  <Td className="max-w-[160px] whitespace-normal">
                    <p className="text-xs font-medium">{returnReasonLabel(r.reasonCode)}</p>
                    <p className="mt-0.5 truncate text-xs text-neutral-400">{r.reason}</p>
                  </Td>
                  <Td className="whitespace-nowrap"><StatusBadge status={r.status} /></Td>
                  <Td className="whitespace-nowrap text-right font-semibold tabular-nums">
                    {r.refundAmount > 0 ? formatCurrency(r.refundAmount, r.currency) : "—"}
                  </Td>
                  {agents.length > 0 && (
                    <Td className="whitespace-nowrap text-xs text-neutral-500">
                      {r.assignedTo ? agentMap[r.assignedTo] ?? "—" : "Unassigned"}
                    </Td>
                  )}
                  <Td className="whitespace-nowrap text-xs text-neutral-400">{formatReturnAge(r.createdAt)}</Td>
                  <Td className="min-w-[240px] whitespace-normal">
                    <ReturnsRowActions ret={r} canManage={canManage} compact />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {!canManage && (
        <p className="flex items-center gap-2 text-xs text-neutral-500">
          <AlertCircle className="h-3.5 w-3.5" />
          View-only access — contact a manager to approve or process refunds.
        </p>
      )}
    </div>
  );
}
