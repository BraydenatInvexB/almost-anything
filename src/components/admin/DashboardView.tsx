import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  DollarSign,
  LifeBuoy,
  Package,
  PackagePlus,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
  ClipboardList,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { StaffProfile } from "@/types/staff-access";
import type { DashboardStats, AdminOrderSummary } from "@/services/admin-service";
import { ROLE_META } from "@/config/rbac";
import { Panel, StatusBadge, BtnSecondary } from "@/components/admin/ui";
import { formatCurrency, cn } from "@/lib/utils/cn";

interface DashboardViewProps {
  staff: StaffProfile;
  stats: DashboardStats;
  fulfillmentCount: number;
  openItemRequests: number;
  showItemRequests: boolean;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardView({
  staff,
  stats,
  fulfillmentCount,
  openItemRequests,
  showItemRequests,
}: DashboardViewProps) {
  const firstName = staff.full_name.split(" ")[0];
  const today = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const weekRevenue = stats.revenueSeries.reduce((s, d) => s + d.value, 0);
  const maxRevenue = Math.max(...stats.revenueSeries.map((d) => d.value), 1);
  const peakDay = stats.revenueSeries.reduce(
    (best, d) => (d.value > best.value ? d : best),
    stats.revenueSeries[0],
  );
  const maxProductRevenue = Math.max(...stats.topProducts.map((p) => p.revenue), 1);
  const maxCategoryRevenue = Math.max(...stats.topCategories.map((c) => c.revenue), 1);

  const attentionItems = [
    {
      title: "Fulfillment",
      count: fulfillmentCount,
      description: "Orders to process or ship",
      href: "/admin/fulfillment",
      icon: Truck,
      urgent: fulfillmentCount > 0,
      color: "bg-brand",
    },
    ...(showItemRequests
      ? [
          {
            title: "Item requests",
            count: openItemRequests,
            description: "Custom product lookups",
            href: "/admin/requests",
            icon: ClipboardList,
            urgent: openItemRequests > 0,
            color: "bg-violet-600",
          },
        ]
      : []),
    {
      title: "Support",
      count: stats.openTickets,
      description: "Tickets awaiting reply",
      href: "/admin/support",
      icon: LifeBuoy,
      urgent: stats.openTickets > 0,
      color: "bg-amber-500",
    },
    {
      title: "Stock alerts",
      count: stats.lowStock,
      description: "Low or out of stock",
      href: "/admin/products",
      icon: Package,
      urgent: stats.lowStock > 0,
      color: "bg-red-600",
    },
  ].sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.count - a.count);

  const totalAttention = attentionItems.reduce((s, i) => s + i.count, 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="absolute inset-y-0 left-0 w-1 bg-brand" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand/[0.06] blur-3xl" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium text-neutral-400">{today}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
              Good day, {firstName}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
              {totalAttention > 0
                ? `You have ${totalAttention} item${totalAttention === 1 ? "" : "s"} across your queues that may need attention today.`
                : "All queues are clear — great time to review performance and plan ahead."}
            </p>
            <span className="mt-4 inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
              {ROLE_META[staff.role].label}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/fulfillment"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand/90"
            >
              <Truck className="h-4 w-4" />
              Operations
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              <ShoppingCart className="h-4 w-4" />
              Orders
            </Link>
            <BtnSecondary href="/admin/reports" className="h-10 shadow-sm">
              Reports
            </BtnSecondary>
          </div>
        </div>
      </section>

      {/* Attention queue */}
      <div>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950">Needs attention</h2>
            <p className="mt-0.5 text-xs text-neutral-500">Jump straight into your daily queues</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {attentionItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className={cn(
                  "group relative flex items-start gap-4 overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                  item.urgent
                    ? "border-brand/25 ring-1 ring-brand/10"
                    : "border-neutral-200/80",
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white",
                    item.color,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-neutral-950">{item.title}</p>
                    <span
                      className={cn(
                        "rounded-lg px-2 py-0.5 text-sm font-black tabular-nums",
                        item.urgent ? "bg-brand text-white" : "bg-neutral-100 text-neutral-800",
                      )}
                    >
                      {item.count}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand opacity-0 transition group-hover:opacity-100">
                    Open <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiTile
          label="Revenue (30d)"
          value={formatCurrency(stats.revenue, "ZAR")}
          change={stats.revenueChange}
          icon={<DollarSign className="h-4 w-4" />}
          accent="from-brand to-red-700"
        />
        <KpiTile
          label="Orders"
          value={String(stats.orders)}
          change={stats.ordersChange}
          icon={<ShoppingCart className="h-4 w-4" />}
          accent="from-neutral-800 to-neutral-950"
        />
        <KpiTile
          label="Customers"
          value={String(stats.customers)}
          change={stats.customersChange}
          icon={<Users className="h-4 w-4" />}
          accent="from-blue-500 to-blue-700"
        />
        <KpiTile
          label="Avg. order"
          value={formatCurrency(stats.avgOrderValue, "ZAR")}
          icon={<Package className="h-4 w-4" />}
          accent="from-emerald-500 to-emerald-700"
        />
      </div>

      {/* Charts + health */}
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
            <HealthMetric
              icon={<LifeBuoy className="h-4 w-4 text-amber-600" />}
              label="Open tickets"
              value={stats.openTickets}
              href="/admin/support"
              status={stats.openTickets > 3 ? "warn" : "ok"}
            />
            <HealthMetric
              icon={<Truck className="h-4 w-4 text-brand" />}
              label="Fulfillment backlog"
              value={fulfillmentCount}
              href="/admin/fulfillment"
              status={fulfillmentCount > 5 ? "warn" : "ok"}
            />
            <HealthMetric
              icon={<Warehouse className="h-4 w-4 text-violet-600" />}
              label="Stock alerts"
              value={stats.lowStock}
              href="/admin/products"
              status={stats.lowStock > 0 ? "warn" : "ok"}
            />
            <HealthMetric
              icon={<BarChart3 className="h-4 w-4 text-blue-600" />}
              label="Active staff"
              value={stats.activeStaff}
              href="/admin/staff"
              status="ok"
            />
          </div>
        </Panel>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <QuickLink href="/admin/products/new" icon={PackagePlus} label="Add product" />
        <QuickLink href="/admin/orders" icon={ShoppingCart} label="All orders" />
        <QuickLink href="/admin/procurement" icon={Warehouse} label="Inbound stock" />
        <QuickLink href="/admin/customers" icon={Users} label="Customers" />
      </div>

      {/* Bottom grid */}
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
              <RecentOrderRow key={o.id} order={o} />
            ))}
            {stats.recentOrders.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-neutral-500">No orders yet.</li>
            )}
          </ul>
        </Panel>

        <Panel title="Top products" className="xl:col-span-4">
          <div className="space-y-4 p-5">
            {stats.topProducts.slice(0, 5).map((p, i) => (
              <RankedRow
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
              <RankedRow
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
    </div>
  );
}

function KpiTile({
  label,
  value,
  change,
  icon,
  accent,
}: {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  accent: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{label}</p>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white",
            accent,
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">{value}</p>
      {change !== undefined && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-semibold",
            positive ? "text-emerald-600" : "text-red-600",
          )}
        >
          {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {Math.abs(change)}% vs last week
        </p>
      )}
    </div>
  );
}

function HealthMetric({
  icon,
  label,
  value,
  href,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  status: "ok" | "warn";
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-5 py-4 transition hover:bg-neutral-50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-neutral-700">{label}</span>
      <span className="text-lg font-black tabular-nums text-neutral-950">{value}</span>
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          status === "warn" ? "bg-brand" : "bg-emerald-500",
        )}
        title={status === "warn" ? "Needs attention" : "Healthy"}
      />
    </Link>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

function RecentOrderRow({ order }: { order: AdminOrderSummary }) {
  return (
    <li>
      <Link
        href={`/admin/orders/${order.id}`}
        className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-neutral-50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-xs font-semibold text-neutral-700">
          {initials(order.customerName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-neutral-950">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="truncate text-xs text-neutral-500">
            {order.customerName} · {formatRelativeTime(order.createdAt)}
          </p>
        </div>
        <span className="shrink-0 text-sm font-black tabular-nums text-neutral-950">
          {formatCurrency(order.total, order.currency)}
        </span>
      </Link>
    </li>
  );
}

function RankedRow({
  rank,
  title,
  meta,
  value,
  pct,
  accent,
}: {
  rank: number;
  title: string;
  meta: string;
  value: string;
  pct: number;
  accent: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[10px] font-bold text-neutral-600">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-neutral-950">{title}</p>
          <p className="text-[11px] text-neutral-400">{meta}</p>
        </div>
        <span className="text-xs font-black tabular-nums text-neutral-800">{value}</span>
      </div>
      <div className="ml-9 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div className={cn("h-full rounded-full transition-all", accent)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
