import {
  BarChart3,
  Package,
  LifeBuoy,
  Truck,
} from "lucide-react";
import { getCurrentStaff, getReportsSummary, listAdminOrders } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import {
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  Table,
  Th,
  Td,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";

export default async function AdminReportsPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "dashboard.view")) {
    return <AccessDenied feature="reports" />;
  }

  const reports = await getReportsSummary();
  const orders = await listAdminOrders();
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const maxDay = Math.max(...reports.ordersByDay.map((d) => d.count), 1);

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        subtitle="Executive overview of revenue, operations, catalog health, and support performance."
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Gross revenue"
          value={formatCurrency(totalRevenue, "ZAR")}
          icon={<BarChart3 className="h-4 w-4" />}
          accent="bg-brand"
        />
        <StatCard
          label="Fulfillment backlog"
          value={String(reports.fulfillmentBacklog)}
          icon={<Truck className="h-4 w-4" />}
          accent="bg-neutral-950"
        />
        <StatCard
          label="Open tickets"
          value={String(reports.supportMetrics.open)}
          icon={<LifeBuoy className="h-4 w-4" />}
          accent="bg-amber-500"
        />
        <StatCard
          label="Catalog SKUs"
          value={String(
            reports.catalogHealth.inStock +
              reports.catalogHealth.availableInternational +
              reports.catalogHealth.lowStock +
              reports.catalogHealth.outOfStock,
          )}
          icon={<Package className="h-4 w-4" />}
          accent="bg-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Revenue by order status">
          <Table>
            <thead>
              <tr className="border-b border-neutral-100">
                <Th>Status</Th>
                <Th>Orders</Th>
                <Th className="text-right">Revenue</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {reports.revenueByStatus.map((row) => (
                <tr key={row.status}>
                  <Td>
                    <StatusBadge status={row.status} />
                  </Td>
                  <Td className="tabular-nums text-neutral-600">{row.count}</Td>
                  <Td className="text-right font-semibold tabular-nums">
                    {formatCurrency(row.total, "ZAR")}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        <Panel title="Order volume (7 day pattern)">
          <div className="flex h-56 items-end gap-2 px-5 py-6">
            {reports.ordersByDay.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-brand/90 transition-all hover:bg-brand"
                    style={{ height: `${Math.max(8, (d.count / maxDay) * 100)}%` }}
                    title={`${d.count} orders`}
                  />
                </div>
                <span className="text-[10px] font-medium text-neutral-400">{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Catalog health">
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
            <div className="rounded-lg bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">{reports.catalogHealth.inStock}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-emerald-600">In stock (SA)</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center ring-1 ring-blue-100">
              <p className="text-2xl font-bold text-blue-700">{reports.catalogHealth.availableInternational}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-blue-600">International</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center ring-1 ring-amber-100">
              <p className="text-2xl font-bold text-amber-700">{reports.catalogHealth.lowStock}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-amber-600">Low stock</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center ring-1 ring-red-100">
              <p className="text-2xl font-bold text-red-700">{reports.catalogHealth.outOfStock}</p>
              <p className="mt-1 text-xs font-semibold uppercase text-red-600">Out of stock</p>
            </div>
          </div>
        </Panel>

        <Panel title="Support performance">
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
              <span className="text-sm text-neutral-600">Open / pending tickets</span>
              <span className="text-lg font-bold">{reports.supportMetrics.open}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
              <span className="text-sm text-neutral-600">Urgent priority</span>
              <span className="text-lg font-bold text-brand">{reports.supportMetrics.urgent}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3">
              <span className="text-sm text-neutral-600">Avg. first response</span>
              <span className="text-lg font-bold">{reports.supportMetrics.avgResponseHrs}h</span>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
