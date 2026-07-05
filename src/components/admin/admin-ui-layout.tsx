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
          {subtitle && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-500">{subtitle}</p>}
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
  clip = false,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
  description?: string;
  /** Clip inner content to rounded corners (disable for tables with dropdown menus). */
  clip?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-neutral-200/80 bg-white shadow-sm",
        clip ? "overflow-hidden" : "overflow-visible",
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
        urgent ? "border-brand/30 bg-brand/[0.02] ring-1 ring-brand/10" : "border-neutral-200/80",
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
