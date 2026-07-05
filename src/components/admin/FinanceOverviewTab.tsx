import {
  AlertTriangle,
  Banknote,
  CreditCard,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { FinanceDashboardData } from "@/lib/admin/finance-types";
import { Panel, StatCard } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { FinanceAlertRow, FinancePlRow } from "@/components/admin/finance-dashboard-shared";

export function FinanceOverviewTab({
  data,
  onSelectTab,
}: {
  data: FinanceDashboardData;
  onSelectTab: (tab: "payables" | "refunds" | "tax") => void;
}) {
  const { summary } = data;
  const cur = summary.currency;
  const maxDayRev = Math.max(...summary.revenueByDay.map((d) => d.revenue), 1);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Gross revenue"
          value={formatCurrency(summary.grossRevenue, cur)}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="bg-brand"
          hint={`${summary.orderCount} orders · AOV ${formatCurrency(summary.avgOrderValue, cur)}`}
        />
        <StatCard
          label="Net profit"
          value={formatCurrency(summary.netProfit, cur)}
          icon={<Wallet className="h-4 w-4" />}
          accent="bg-emerald-600"
          hint={`${summary.netMarginPct}% net margin`}
        />
        <StatCard
          label="Operating expenses"
          value={formatCurrency(summary.operatingExpenses, cur)}
          icon={<Receipt className="h-4 w-4" />}
          accent="bg-neutral-800"
          hint={summary.periodLabel}
        />
        <StatCard
          label="Net cash flow"
          value={formatCurrency(summary.netCashFlow, cur)}
          icon={<Banknote className="h-4 w-4" />}
          accent={summary.netCashFlow >= 0 ? "bg-emerald-600" : "bg-red-600"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Profit & loss" description={summary.periodLabel} className="lg:col-span-2">
          <dl className="divide-y divide-neutral-100">
            <FinancePlRow label="Gross revenue" value={formatCurrency(summary.grossRevenue, cur)} />
            <FinancePlRow label="Refunds issued" value={`−${formatCurrency(summary.refundsIssued, cur)}`} negative />
            <FinancePlRow label="Net revenue" value={formatCurrency(summary.netRevenue, cur)} bold />
            <FinancePlRow label="Cost of goods sold (COGS)" value={`−${formatCurrency(summary.cogs, cur)}`} negative />
            <FinancePlRow
              label={`Gross profit (${summary.grossMarginPct}%)`}
              value={formatCurrency(summary.grossProfit, cur)}
              bold
            />
            <FinancePlRow label="Shipping & couriers" value={`−${formatCurrency(summary.shippingCosts, cur)}`} negative />
            <FinancePlRow label="Marketing" value={`−${formatCurrency(summary.marketingSpend, cur)}`} negative />
            <FinancePlRow label="Payroll" value={`−${formatCurrency(summary.payroll, cur)}`} negative />
            <FinancePlRow label="Other operating" value={`−${formatCurrency(summary.otherExpenses, cur)}`} negative />
            <FinancePlRow
              label={`Net profit (${summary.netMarginPct}%)`}
              value={formatCurrency(summary.netProfit, cur)}
              bold
              highlight
            />
          </dl>
        </Panel>

        <Panel title="Alerts & obligations">
          <ul className="divide-y divide-neutral-100">
            <FinanceAlertRow
              icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
              label="Pending payables"
              value={formatCurrency(summary.pendingPayables, cur)}
              href="/admin/finance"
              onClick={() => onSelectTab("payables")}
            />
            <FinanceAlertRow
              icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
              label="Overdue invoices"
              value={formatCurrency(summary.overduePayables, cur)}
              urgent={summary.overduePayables > 0}
              onClick={() => onSelectTab("payables")}
            />
            <FinanceAlertRow
              icon={<CreditCard className="h-4 w-4 text-neutral-400" />}
              label="Outstanding refunds"
              value={formatCurrency(summary.outstandingRefunds, cur)}
              onClick={() => onSelectTab("refunds")}
            />
            <FinanceAlertRow
              icon={<Receipt className="h-4 w-4 text-neutral-400" />}
              label="VAT collected"
              value={formatCurrency(summary.vatCollected, cur)}
              onClick={() => onSelectTab("tax")}
            />
          </ul>
        </Panel>
      </div>

      <Panel title="Revenue trend" description="Daily gross revenue">
        <div className="flex items-end gap-1.5 px-5 pb-5 pt-2" style={{ minHeight: 160 }}>
          {summary.revenueByDay.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-neutral-500">
                {formatCurrency(d.revenue, cur)}
              </span>
              <div
                className="w-full rounded-t-md bg-brand/80 transition-all"
                style={{ height: `${Math.max(8, (d.revenue / maxDayRev) * 120)}px` }}
              />
              <span className="text-[10px] text-neutral-400">{d.label.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
