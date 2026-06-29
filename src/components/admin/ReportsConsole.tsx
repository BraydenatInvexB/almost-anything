"use client";

import { useMemo, useState } from "react";
import type { ReportsSummary } from "@/services/admin-service";
import type { AdminOrderSummary } from "@/services/admin-service";
import { Panel, StatusBadge, Table, Th, Td } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";

export function ReportsConsole({
  reports,
  orders,
}: {
  reports: ReportsSummary;
  orders: AdminOrderSummary[];
}) {
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");

  const filteredOrders = useMemo(() => {
    if (range === "all") return orders;
    const days = range === "7d" ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return orders.filter((o) => new Date(o.createdAt) >= cutoff);
  }, [orders, range]);

  const revenue = filteredOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  const byStatus = useMemo(() => {
    const statuses = ["pending", "paid", "sourcing", "purchased", "shipped", "delivered", "cancelled"];
    return statuses.map((status) => {
      const matched = filteredOrders.filter((o) => o.status === status);
      return {
        status,
        count: matched.length,
        total: matched.reduce((s, o) => s + o.total, 0),
      };
    });
  }, [filteredOrders]);

  function exportCsv() {
    const rows = [
      ["Order", "Customer", "Status", "Total", "Date"],
      ...filteredOrders.map((o) => [
        o.orderNumber,
        o.customerName,
        o.status,
        String(o.total),
        o.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-report-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                range === r ? "bg-brand text-white" : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {r === "all" ? "All time" : `Last ${r === "7d" ? "7 days" : "30 days"}`}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-neutral-50"
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase text-neutral-500">Gross revenue</p>
        <p className="mt-1 text-3xl font-bold text-neutral-950">{formatCurrency(revenue, "ZAR")}</p>
        <p className="mt-1 text-sm text-neutral-500">{filteredOrders.length} orders in range</p>
      </div>

      <Panel title="Revenue by status">
        <Table>
          <thead>
            <tr className="border-b border-neutral-100">
              <Th>Status</Th>
              <Th>Orders</Th>
              <Th className="text-right">Revenue</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {byStatus.map((row) => (
              <tr key={row.status}>
                <Td>
                  <StatusBadge status={row.status} />
                </Td>
                <Td>{row.count}</Td>
                <Td className="text-right font-semibold">{formatCurrency(row.total, "ZAR")}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Catalog health">
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {[
              { label: "In stock", value: reports.catalogHealth.inStock, color: "text-emerald-700" },
              { label: "International", value: reports.catalogHealth.availableInternational, color: "text-blue-700" },
              { label: "Low stock", value: reports.catalogHealth.lowStock, color: "text-amber-700" },
              { label: "Out of stock", value: reports.catalogHealth.outOfStock, color: "text-red-700" },
            ].map((c) => (
              <div key={c.label} className="rounded-lg bg-neutral-50 p-3 text-center">
                <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-[10px] font-semibold uppercase text-neutral-500">{c.label}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Support">
          <div className="space-y-3 p-5 text-sm">
            <div className="flex justify-between">
              <span>Open tickets</span>
              <span className="font-bold">{reports.supportMetrics.open}</span>
            </div>
            <div className="flex justify-between">
              <span>Urgent</span>
              <span className="font-bold text-brand">{reports.supportMetrics.urgent}</span>
            </div>
            <div className="flex justify-between">
              <span>Fulfillment backlog</span>
              <span className="font-bold">{reports.fulfillmentBacklog}</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
