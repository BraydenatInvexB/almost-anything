import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { getStockStatusLabel } from "@/config/product-stock";
import { getOrderStatusLabel } from "@/lib/orders/order-operations";

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
  available_international: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  low_stock: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  out_of_stock: "bg-red-50 text-red-700 ring-1 ring-red-100",
  sourced: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  requested: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  searching: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  found: "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  quoted: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
  failed: "bg-red-50 text-red-700 ring-1 ring-red-100",
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
  unsubscribed: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
  sent: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  other: "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200",
};

export function StatusBadge({ status }: { status: string }) {
  const productLabel = getStockStatusLabel(status);
  const orderLabel = getOrderStatusLabel(status);
  const label =
    productLabel !== status.replace(/_/g, " ")
      ? productLabel
      : orderLabel !== status.replace(/_/g, " ")
        ? orderLabel
        : status.replace(/_/g, " ");
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
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 shadow-sm transition-colors hover:bg-neutral-50 disabled:opacity-50",
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
