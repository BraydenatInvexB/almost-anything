import { cn } from "@/lib/utils/cn";

export type FinanceTab = "overview" | "revenue" | "expenses" | "payables" | "refunds" | "shipping" | "tax";

export const FINANCE_TABS: { id: FinanceTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "revenue", label: "Revenue & payments" },
  { id: "expenses", label: "Expenses" },
  { id: "payables", label: "Accounts payable" },
  { id: "refunds", label: "Refunds" },
  { id: "shipping", label: "Courier costs" },
  { id: "tax", label: "Tax & VAT" },
];

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  procurement: "Procurement",
  shipping: "Shipping & couriers",
  marketing: "Marketing",
  payroll: "Payroll",
  operations: "Operations",
  refunds: "Refunds",
  other: "Other",
};

export function FinancePlRow({
  label,
  value,
  bold,
  negative,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-3 text-sm",
        highlight && "bg-neutral-50",
      )}
    >
      <dt className={cn("text-neutral-600", bold && "font-semibold text-neutral-900")}>{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          bold && "font-bold text-neutral-950",
          negative && "text-red-600",
          highlight && "text-brand",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function FinanceAlertRow({
  icon,
  label,
  value,
  urgent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  urgent?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-sm hover:bg-neutral-50"
      >
        {icon}
        <span className="flex-1 font-medium text-neutral-800">{label}</span>
        <span className={cn("font-bold tabular-nums", urgent && "text-red-600")}>{value}</span>
      </button>
    </li>
  );
}
