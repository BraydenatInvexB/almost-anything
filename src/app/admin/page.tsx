import {
  DollarSign,
  ShoppingCart,
  Users,
  LifeBuoy,
  Package,
} from "lucide-react";
import { getCurrentStaff, getDashboardStats } from "@/services/admin-service";
import { can } from "@/config/rbac";
import { ROLE_META } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusBadge,
  Table,
  Th,
  Td,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";

export default async function AdminDashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff || !can(staff.role, "dashboard.view")) return <AccessDenied feature="the dashboard" />;

  const stats = await getDashboardStats();
  const maxRevenue = Math.max(...stats.revenueSeries.map((d) => d.value));

  return (
    <>
      <PageHeader
        title={`Welcome back, ${staff.full_name.split(" ")[0]}`}
        subtitle={`${ROLE_META[staff.role].label} · Here's how Almost Anything is performing today.`}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (30d)"
          value={formatCurrency(stats.revenue, "USD")}
          change={stats.revenueChange}
          icon={<DollarSign className="h-4 w-4" />}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Orders"
          value={String(stats.orders)}
          change={stats.ordersChange}
          icon={<ShoppingCart className="h-4 w-4" />}
          accent="bg-blue-500"
        />
        <StatCard
          label="Customers"
          value={String(stats.customers)}
          change={stats.customersChange}
          icon={<Users className="h-4 w-4" />}
          accent="bg-violet-500"
        />
        <StatCard
          label="Avg. order value"
          value={formatCurrency(stats.avgOrderValue, "USD")}
          icon={<Package className="h-4 w-4" />}
          accent="bg-neutral-900"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <Panel title="Revenue this week" className="lg:col-span-2">
          <div className="flex h-56 gap-3 px-5 py-6">
            {stats.revenueSeries.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-neutral-900 transition-all hover:bg-neutral-700"
                    style={{ height: `${Math.max(4, (d.value / maxRevenue) * 100)}%` }}
                    title={formatCurrency(d.value, "USD")}
                  />
                </div>
                <span className="text-[11px] text-neutral-400">{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Quick health */}
        <Panel title="Operations">
          <div className="flex flex-col divide-y divide-neutral-100">
            <HealthRow
              icon={<LifeBuoy className="h-4 w-4 text-amber-600" />}
              label="Open support tickets"
              value={String(stats.openTickets)}
              href="/admin/support"
            />
            <HealthRow
              icon={<Package className="h-4 w-4 text-red-500" />}
              label="Low / out of stock"
              value={String(stats.lowStock)}
              href="/admin/products"
            />
            <HealthRow
              icon={<Users className="h-4 w-4 text-blue-500" />}
              label="Active staff"
              value={String(stats.activeStaff)}
              href="/admin/staff"
            />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Panel title="Recent orders" className="lg:col-span-2">
          <Table>
            <thead>
              <tr className="border-b border-neutral-100">
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {stats.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-neutral-50">
                  <Td className="font-medium">{o.orderNumber}</Td>
                  <Td className="text-neutral-600">{o.customerName}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td className="text-right font-semibold">
                    {formatCurrency(o.total, o.currency)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>

        {/* Top products */}
        <Panel title="Top products">
          <div className="flex flex-col gap-3 p-5">
            {stats.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{p.name}</p>
                  <p className="text-xs text-neutral-400">{p.sold} sold</p>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(p.revenue, "USD")}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

function HealthRow({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a href={href} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-neutral-50">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100">{icon}</span>
      <span className="flex-1 text-sm text-neutral-600">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </a>
  );
}
