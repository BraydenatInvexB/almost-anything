import Link from "next/link";
import {
  BarChart3,
  LifeBuoy,
  PackagePlus,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import type { DashboardStats } from "@/services/admin-service";
import { Panel } from "@/components/admin/ui";
import { formatCurrency, cn } from "@/lib/utils/cn";
import {
  DashboardHealthMetric,
  DashboardQuickLink,
  DashboardRankedRow,
  DashboardRecentOrderRow,
} from "@/components/admin/DashboardViewParts";

export function DashboardViewCharts({
  stats,
  fulfillmentCount,
}: {
  stats: DashboardStats;
  fulfillmentCount: number;
}) {
  const weekRevenue = stats.revenueSeries.reduce((s, d) => s + d.value, 0);
  const maxRevenue = Math.max(...stats.revenueSeries.map((d) => d.value), 1);
  const peakDay = stats.revenueSeries.reduce(
    (best, d) => (d.value > best.value ? d : best),
    stats.revenueSeries[0],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <Panel
        title="Revenue this week"
        description={`${formatCurrency(weekRevenue, "ZAR")} total · peak ${peakDay.label}`}
        className="lg:col-span-3"
      >
        <div className="px-5 pb-6 pt-2">
          <div className="flex h-52 items-end gap-2 sm:gap-3">
            {stats.revenueSeries.map((d) => {
              const barHeight = Math.max(
                d.value > 0 ? 6 : 0,
                Math.round((d.value / maxRevenue) * 176),
              );
              const isPeak = d.label === peakDay.label && d.value > 0;
              return (
                <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
                  <span className="text-[10px] font-bold tabular-nums text-neutral-400 opacity-0 transition group-hover:opacity-100">
                    {d.value > 0 ? formatCurrency(d.value, "ZAR") : "—"}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      isPeak ? "bg-brand" : "bg-neutral-200 group-hover:bg-neutral-300",
                    )}
                    style={{ height: barHeight }}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wide",
                      isPeak ? "text-brand" : "text-neutral-400",
                    )}
                  >
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Panel>

      <Panel title="System health" className="lg:col-span-2">
        <div className="divide-y divide-neutral-100">
          <DashboardHealthMetric
            icon={<LifeBuoy className="h-4 w-4 text-amber-600" />}
            label="Open tickets"
            value={stats.openTickets}
            href="/admin/support"
            status={stats.openTickets > 3 ? "warn" : "ok"}
          />
          <DashboardHealthMetric
            icon={<Truck className="h-4 w-4 text-brand" />}
            label="Fulfillment backlog"
            value={fulfillmentCount}
            href="/admin/fulfillment"
            status={fulfillmentCount > 5 ? "warn" : "ok"}
          />
          <DashboardHealthMetric
            icon={<Warehouse className="h-4 w-4 text-violet-600" />}
            label="Stock alerts"
            value={stats.lowStock}
            href="/admin/products"
            status={stats.lowStock > 0 ? "warn" : "ok"}
          />
          <DashboardHealthMetric
            icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
            label="Active staff"
            value={stats.activeStaff}
            href="/admin/staff"
            status="ok"
          />
        </div>
      </Panel>
    </div>
  );
}

export function DashboardViewQuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <DashboardQuickLink href="/admin/products/new" icon={PackagePlus} label="Add product" />
      <DashboardQuickLink href="/admin/orders" icon={ShoppingCart} label="All orders" />
      <DashboardQuickLink href="/admin/procurement" icon={Warehouse} label="Inbound stock" />
      <DashboardQuickLink href="/admin/customers" icon={Users} label="Customers" />
    </div>
  );
}

export function DashboardViewBottomGrid({ stats }: { stats: DashboardStats }) {
  const maxProductRevenue = Math.max(...stats.topProducts.map((p) => p.revenue), 1);
  const maxCategoryRevenue = Math.max(...stats.topCategories.map((c) => c.revenue), 1);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Panel
        title="Recent orders"
        className="xl:col-span-5"
        action={
          <Link href="/admin/orders" className="text-xs font-bold text-brand hover:underline">
            View all
          </Link>
        }
        clip
      >
        <ul className="divide-y divide-neutral-100">
          {stats.recentOrders.slice(0, 6).map((o) => (
            <DashboardRecentOrderRow key={o.id} order={o} />
          ))}
          {stats.recentOrders.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-neutral-500">No orders yet.</li>
          )}
        </ul>
      </Panel>

      <Panel title="Top products" className="xl:col-span-4">
        <div className="space-y-4 p-5">
          {stats.topProducts.slice(0, 5).map((p, i) => (
            <DashboardRankedRow
              key={p.name}
              rank={i + 1}
              title={p.name}
              meta={`${p.sold} sold`}
              value={formatCurrency(p.revenue, "ZAR")}
              pct={(p.revenue / maxProductRevenue) * 100}
              accent="bg-neutral-400"
            />
          ))}
        </div>
      </Panel>

      <Panel title="Top categories" className="xl:col-span-3">
        <div className="space-y-4 p-5">
          {stats.topCategories.slice(0, 5).map((c, i) => (
            <DashboardRankedRow
              key={c.name}
              rank={i + 1}
              title={c.name}
              meta={`${c.sold} units`}
              value={formatCurrency(c.revenue, "ZAR")}
              pct={(c.revenue / maxCategoryRevenue) * 100}
              accent="bg-brand"
            />
          ))}
          {stats.topCategories.length === 0 && (
            <p className="text-sm text-neutral-500">Category data builds as orders come in.</p>
          )}
        </div>
      </Panel>
    </div>
  );
}
