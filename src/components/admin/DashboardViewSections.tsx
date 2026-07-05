import Link from "next/link";
import {
  ArrowRight,
  DollarSign,
  Package,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import type { StaffProfile } from "@/types/staff-access";
import type { DashboardStats } from "@/services/admin-service";
import { ROLE_META } from "@/config/rbac";
import { BtnSecondary } from "@/components/admin/ui";
import { formatCurrency, cn } from "@/lib/utils/cn";
import { DashboardKpiTile } from "@/components/admin/DashboardViewParts";

export type AttentionItem = {
  title: string;
  count: number;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  urgent: boolean;
  color: string;
};

export function DashboardViewHero({
  staff,
  totalAttention,
  today,
}: {
  staff: StaffProfile;
  totalAttention: number;
  today: string;
}) {
  const firstName = staff.full_name.split(" ")[0];

  return (
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
  );
}

export function DashboardViewAttention({ items }: { items: AttentionItem[] }) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">Needs attention</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Jump straight into your daily queues</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
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
  );
}

export function DashboardViewKpis({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <DashboardKpiTile
        label="Revenue (30d)"
        value={formatCurrency(stats.revenue, "ZAR")}
        change={stats.revenueChange}
        icon={<DollarSign className="h-4 w-4" />}
        accent="from-brand to-red-700"
      />
      <DashboardKpiTile
        label="Orders"
        value={String(stats.orders)}
        change={stats.ordersChange}
        icon={<ShoppingCart className="h-4 w-4" />}
        accent="from-neutral-800 to-neutral-950"
      />
      <DashboardKpiTile
        label="Customers"
        value={String(stats.customers)}
        change={stats.customersChange}
        icon={<Users className="h-4 w-4" />}
        accent="from-blue-500 to-blue-700"
      />
      <DashboardKpiTile
        label="Avg. order"
        value={formatCurrency(stats.avgOrderValue, "ZAR")}
        icon={<Package className="h-4 w-4" />}
        accent="from-emerald-500 to-emerald-700"
      />
    </div>
  );
}
