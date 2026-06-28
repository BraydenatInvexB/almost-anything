import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function Panel({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-neutral-200 bg-white", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          {title && <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  change,
  icon,
  accent = "bg-neutral-900",
}: {
  label: string;
  value: string;
  change?: number;
  icon?: ReactNode;
  accent?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{label}</p>
        {icon && (
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl text-white", accent)}>
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-900">{value}</p>
      {change !== undefined && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-xs font-medium",
            positive ? "text-emerald-600" : "text-red-500",
          )}
        >
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(change)}% vs last week
        </p>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  // orders
  paid: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  sourcing: "bg-violet-100 text-violet-700",
  purchased: "bg-indigo-100 text-indigo-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
  // tickets
  open: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-neutral-200 text-neutral-600",
  // priority
  low: "bg-neutral-200 text-neutral-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
  // staff / customer
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-red-100 text-red-700",
  invited: "bg-amber-100 text-amber-700",
  vip: "bg-violet-100 text-violet-700",
  flagged: "bg-red-100 text-red-700",
  in_stock: "bg-emerald-100 text-emerald-700",
  low_stock: "bg-amber-100 text-amber-700",
  out_of_stock: "bg-red-100 text-red-700",
  sourced: "bg-violet-100 text-violet-700",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize",
        STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-600",
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description?: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-sm font-semibold text-neutral-700">{title}</p>
      {description && <p className="max-w-sm text-sm text-neutral-500">{description}</p>}
      {cta && (
        <Link
          href={cta.href}
          className="mt-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("whitespace-nowrap px-5 py-3.5 align-middle", className)}>{children}</td>;
}
