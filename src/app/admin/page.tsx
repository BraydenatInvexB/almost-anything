import Link from "next/link";
import Image from "next/image";
import {
  DollarSign,
  ShoppingCart,
  Users,
  LifeBuoy,
  Package,
  Truck,
  BarChart3,
} from "lucide-react";
import { getCurrentStaff, getDashboardStats, getFulfillmentQueue } from "@/services/admin-service";
import { countOpenItemRequests } from "@/services/sourcing-request-service";
import { can, staffCan } from "@/config/rbac";
import { ROLE_META } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import {
  StatCard,
  Panel,
  StatusBadge,
  Table,
  Th,
  Td,
  WorkflowCard,
  BtnSecondary,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { SITE_CONFIG } from "@/config/site";

export default async function AdminDashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "dashboard.view")) return <AccessDenied feature="the dashboard" />;

  const stats = await getDashboardStats();
  const fulfillment = await getFulfillmentQueue();
  const openItemRequests = staffCan(staff, "procurement.view") ? countOpenItemRequests() : 0;
  const maxRevenue = Math.max(...stats.revenueSeries.map((d) => d.value), 1);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/admin" className="shrink-0 pt-0.5">
            <Image
              src={SITE_CONFIG.logo}
              alt={SITE_CONFIG.name}
              width={180}
              height={44}
              className="h-10 w-auto"
              priority
            />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Operations overview</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {ROLE_META[staff.role].label} · {staff.full_name.split(" ")[0]}, here is what needs your attention today.
            </p>
          </div>
        </div>
        <BtnSecondary href="/admin/reports">Full reports</BtnSecondary>
      </div>

      {/* Workflow queues */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <WorkflowCard
          title="Fulfillment queue"
          count={fulfillment.length}
          description="Orders paid or purchased that need warehouse action."
          href="/admin/fulfillment"
          urgent={fulfillment.length > 0}
        />
        {staffCan(staff, "procurement.view") && (
          <WorkflowCard
            title="Item requests"
            count={openItemRequests}
            description="Customers looking for products not in the catalog."
            href="/admin/requests"
            urgent={openItemRequests > 0}
          />
        )}
        <WorkflowCard
          title="Open support"
          count={stats.openTickets}
          description="Customer tickets waiting for a response."
          href="/admin/support"
          urgent={stats.openTickets > 3}
        />
        <WorkflowCard
          title="Low / out of stock"
          count={stats.lowStock}
          description="Catalog items that may block new orders."
          href="/admin/products"
          urgent={stats.lowStock > 0}
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue (30d)"
          value={formatCurrency(stats.revenue, "ZAR")}
          change={stats.revenueChange}
          icon={<DollarSign className="h-4 w-4" />}
          accent="bg-brand"
        />
        <StatCard
          label="Orders"
          value={String(stats.orders)}
          change={stats.ordersChange}
          icon={<ShoppingCart className="h-4 w-4" />}
          accent="bg-neutral-950"
        />
        <StatCard
          label="Customers"
          value={String(stats.customers)}
          change={stats.customersChange}
          icon={<Users className="h-4 w-4" />}
          accent="bg-blue-600"
        />
        <StatCard
          label="Avg. order value"
          value={formatCurrency(stats.avgOrderValue, "ZAR")}
          icon={<Package className="h-4 w-4" />}
          accent="bg-emerald-600"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Revenue this week" className="lg:col-span-2">
          <div className="flex h-56 gap-2 px-5 py-6">
            {stats.revenueSeries.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-neutral-950 transition-all hover:bg-brand"
                    style={{ height: `${Math.max(4, (d.value / maxRevenue) * 100)}%` }}
                    title={formatCurrency(d.value, "ZAR")}
                  />
                </div>
                <span className="text-[10px] font-medium text-neutral-400">{d.label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Team & systems">
          <div className="flex flex-col divide-y divide-neutral-100">
            <HealthRow
              icon={<LifeBuoy className="h-4 w-4 text-amber-600" />}
              label="Open support tickets"
              value={String(stats.openTickets)}
              href="/admin/support"
            />
            <HealthRow
              icon={<Truck className="h-4 w-4 text-brand" />}
              label="Fulfillment backlog"
              value={String(fulfillment.length)}
              href="/admin/fulfillment"
            />
            <HealthRow
              icon={<Package className="h-4 w-4 text-red-500" />}
              label="Stock alerts"
              value={String(stats.lowStock)}
              href="/admin/products"
            />
            <HealthRow
              icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
              label="Active staff"
              value={String(stats.activeStaff)}
              href="/admin/staff"
            />
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel
          title="Recent orders"
          className="lg:col-span-2"
          action={
            <Link href="/admin/orders" className="text-xs font-semibold text-brand hover:underline">
              View all
            </Link>
          }
        >
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
                <tr key={o.id} className="hover:bg-neutral-50/80">
                  <Td>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-semibold text-neutral-950 hover:text-brand"
                    >
                      {o.orderNumber}
                    </Link>
                  </Td>
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

        <Panel title="Top products">
          <div className="flex flex-col gap-3 p-5">
            {stats.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-950">{p.name}</p>
                  <p className="text-xs text-neutral-400">{p.sold} sold</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(p.revenue, "ZAR")}
                </span>
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
    <Link href={href} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-neutral-50/80">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">{icon}</span>
      <span className="flex-1 text-sm text-neutral-600">{label}</span>
      <span className="text-lg font-bold tabular-nums">{value}</span>
    </Link>
  );
}
