import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { getStockLevel, STOCK_LEVEL_LABELS, STOCK_LEVEL_STYLES } from "@/lib/seller/stock-status";

export function SellerPanel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SellerPanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-6 py-4", className)}>
      <div>
        <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
        {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function SellerPanelBody({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function SellerStatGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function SellerStat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "neutral" | "warning" | "success";
}) {
  const toneStyles = {
    neutral: "text-neutral-900",
    warning: "text-amber-700",
    success: "text-emerald-700",
  };

  return (
    <SellerPanel className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold tabular-nums", toneStyles[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-sm text-neutral-500">{hint}</p> : null}
    </SellerPanel>
  );
}

export function SellerEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 px-6 py-10 text-center">
      <p className="font-medium text-neutral-800">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">{description}</p>
    </div>
  );
}

export function SellerStockBadge({ quantity }: { quantity: number }) {
  const level = getStockLevel(quantity);
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", STOCK_LEVEL_STYLES[level])}>
      {STOCK_LEVEL_LABELS[level]}
    </span>
  );
}
