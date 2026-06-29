"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import type { CustomerItemRequest, ItemRequestStatus } from "@/lib/admin/operations-types";
import type { StaffProfile } from "@/types/staff-access";
import {
  computeItemRequestMetrics,
  formatItemRequestAge,
  itemRequestStatusLabel,
  sortItemRequestsForQueue,
} from "@/lib/sourcing/requests";
import {
  EmptyState,
  Panel,
  StatCard,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { ItemRequestRowActions } from "@/components/admin/ItemRequestRowActions";

const STATUS_FILTERS: { value: ItemRequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "searching", label: "Searching" },
  { value: "found", label: "Found" },
  { value: "quoted", label: "Quoted" },
  { value: "purchased", label: "Purchased" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];

function RequestFilters({ status, query }: { status: string; query: string }) {
  return (
    <form className="flex flex-wrap items-center gap-3" method="get">
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Search request, query, email…"
          className="input w-full pl-9"
        />
      </div>
      <select name="status" defaultValue={status} className="input w-40">
        {STATUS_FILTERS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-secondary h-9 rounded-lg px-4 text-sm font-semibold">
        Filter
      </button>
    </form>
  );
}

export function SourcingRequestsDesk({
  requests,
  canManage,
  agents = [],
  initialStatus = "all",
  initialQuery = "",
}: {
  requests: CustomerItemRequest[];
  canManage: boolean;
  agents?: StaffProfile[];
  initialStatus?: string;
  initialQuery?: string;
}) {
  const metrics = computeItemRequestMetrics(requests);

  let filtered = requests;
  if (initialStatus !== "all") {
    filtered = filtered.filter((r) => r.status === initialStatus);
  }
  if (initialQuery.trim()) {
    const q = initialQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.requestNumber.toLowerCase().includes(q) ||
        r.query.toLowerCase().includes(q) ||
        (r.customerEmail?.toLowerCase().includes(q) ?? false),
    );
  }
  filtered = sortItemRequestsForQueue(filtered);

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open requests" value={String(metrics.open)} accent="bg-brand" />
        <StatCard label="Searching" value={String(metrics.searching)} accent="bg-violet-600" />
        <StatCard label="Awaiting quote" value={String(metrics.quoted)} accent="bg-amber-600" />
        <StatCard label="Unassigned" value={String(metrics.unassigned)} accent="bg-neutral-800" />
      </div>

      <Panel>
        <div className="border-b border-neutral-100 p-4">
          <RequestFilters status={initialStatus} query={initialQuery} />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={initialQuery || initialStatus !== "all" ? "No requests match your filters" : "No item requests yet"}
            description={
              initialQuery || initialStatus !== "all"
                ? "Try a different search or status filter."
                : "Customer requests from the storefront Request an Item form will appear here."
            }
          />
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-neutral-100">
                <Th>Request</Th>
                <Th>Customer</Th>
                <Th>Budget</Th>
                <Th>Status</Th>
                <Th>Assigned</Th>
                <Th>Submitted</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <Td className="max-w-xs">
                    <Link
                      href={`/admin/requests/${r.id}`}
                      className="font-mono text-xs font-semibold text-neutral-900 hover:text-brand"
                    >
                      {r.requestNumber}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{r.query}</p>
                    {r.quotedAmount != null && r.quotedAmount > 0 && (
                      <p className="mt-1 text-xs font-medium text-emerald-600">
                        Quoted {formatCurrency(r.quotedAmount, r.currency)}
                      </p>
                    )}
                  </Td>
                  <Td className="text-sm text-neutral-600">
                    {r.customerEmail ? (
                      <a href={`mailto:${r.customerEmail}`} className="hover:text-brand hover:underline">
                        {r.customerEmail}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td className="text-sm tabular-nums text-neutral-600">
                    {r.budget ? formatCurrency(r.budget, r.currency) : "—"}
                  </Td>
                  <Td>
                    <StatusBadge status={r.status} />
                    <span className="sr-only">{itemRequestStatusLabel(r.status)}</span>
                  </Td>
                  <Td className="text-sm text-neutral-600">{r.assignedToName ?? "Unassigned"}</Td>
                  <Td className="text-sm text-neutral-500">{formatItemRequestAge(r.createdAt)}</Td>
                  <Td>
                    <ItemRequestRowActions request={r} agents={agents} canManage={canManage} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <p className="mt-4 text-xs text-neutral-500">
        Submissions from{" "}
        <Link href="/request" className="font-medium text-brand hover:underline">
          /request
        </Link>{" "}
        on the storefront appear here automatically.
      </p>
    </>
  );
}
