import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { AdminOrderSummary } from "@/services/admin-service";
import { StatusBadge } from "@/components/admin/ui";
import { formatCurrency, cn } from "@/lib/utils/cn";
import { formatRelativeTime, initials } from "@/components/admin/dashboard-view-utils";

export function DashboardKpiTile({
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

export function DashboardHealthMetric({
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

export function DashboardQuickLink({
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

export function DashboardRecentOrderRow({ order }: { order: AdminOrderSummary }) {
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

export function DashboardRankedRow({
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
