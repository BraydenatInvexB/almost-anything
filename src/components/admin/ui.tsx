import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumbs,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-neutral-500">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-neutral-300" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-brand">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-medium text-neutral-700">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-neutral-500">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function Panel({
  children,
  className,
  title,
  action,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  description?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm",
        className,
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold text-neutral-950">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
          </div>
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
  accent = "bg-neutral-950",
  hint,
}: {
  label: string;
  value: string;
  change?: number;
  icon?: ReactNode;
  accent?: string;
  hint?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white",
              accent,
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">{value}</p>
      {change !== undefined && (
        <p
          className={cn(
            "mt-1.5 flex items-center gap-1 text-xs font-medium",
            positive ? "text-emerald-600" : "text-red-600",
          )}
        >
          {positive ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {Math.abs(change)}% vs prior period
        </p>
      )}
      {hint && !change && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

export function WorkflowCard({
  title,
  count,
  description,
  href,
  urgent,
}: {
  title: string;
  count: number;
  description: string;
  href: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        urgent ? "border-brand/30 bg-brand/[0.02]" : "border-neutral-200/80",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-neutral-950">{title}</p>
        <span
          className={cn(
            "rounded-lg px-2.5 py-1 text-lg font-bold tabular-nums",
            urgent ? "bg-brand text-white" : "bg-neutral-100 text-neutral-900",
          )}
        >
          {count}
        </span>
      </div>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-neutral-500">{description}</p>
      <span className="mt-4 text-xs font-semibold text-brand group-hover:underline">
        Open queue →
      </span>
    </Link>
  );
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  sourcing: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  purchased: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
  shipped: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
  delivered: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  cancelled: "bg-red-50 text-red-700 ring-1 ring-red-100",
  open: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  resolved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  closed: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
  low: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
  normal: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  high: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  urgent: "bg-red-50 text-red-700 ring-1 ring-red-100",
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  suspended: "bg-red-50 text-red-700 ring-1 ring-red-100",
  invited: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  vip: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  flagged: "bg-red-50 text-red-700 ring-1 ring-red-100",
  in_stock: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  low_stock: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  out_of_stock: "bg-red-50 text-red-700 ring-1 ring-red-100",
  sourced: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  requested: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  approved: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  received: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  refunded: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-100",
  ordered: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
  in_transit: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
  draft: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
  scheduled: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  live: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  ended: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
  procurement: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  shipping: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
  marketing: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  payroll: "bg-pink-50 text-pink-700 ring-1 ring-pink-100",
  operations: "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200",
  refunds: "bg-red-50 text-red-700 ring-1 ring-red-100",
  other: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize",
        STATUS_STYLES[status] ?? "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
      )}
    >
      {label}
    </span>
  );
}

export function BtnPrimary({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({
  children,
  className,
  href,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: string }) {
  const cls = cn(
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

export function TabBar({
  tabs,
  active,
}: {
  tabs: { label: string; href: string; count?: number }[];
  active: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-neutral-200/80 bg-neutral-50 p-1">
      {tabs.map((tab) => {
        const isActive = active === tab.label.toLowerCase() || active === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
              isActive
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-500">
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
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
          className="mt-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white"
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
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap bg-neutral-50/80 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500",
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

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</dl>;
}

export function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

export function Timeline({
  events,
}: {
  events: { label: string; at: string; note?: string }[];
}) {
  return (
    <ol className="relative space-y-4 border-l border-neutral-200 pl-5">
      {events.map((event, i) => (
        <li key={`${event.label}-${event.at}-${i}`} className="relative">
          <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand ring-2 ring-brand/20" />
          <p className="text-sm font-semibold text-neutral-900">{event.label}</p>
          <p className="text-xs text-neutral-500">
            {new Date(event.at).toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          {event.note && <p className="mt-1 text-xs text-neutral-600">{event.note}</p>}
        </li>
      ))}
    </ol>
  );
}
