"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Banknote,
  CreditCard,
  Receipt,
  Truck,
  Wallet,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type { Expense, ReturnRequest } from "@/lib/admin/operations-types";
import type { FinanceDashboardData, SupplierPayable } from "@/lib/admin/finance-types";
import {
  BtnPrimary,
  Panel,
  StatCard,
  StatusBadge,
  Table,
  Th,
  Td,
} from "@/components/admin/ui";
import { formatCurrency, cn } from "@/lib/utils/cn";

type Tab = "overview" | "revenue" | "expenses" | "payables" | "refunds" | "shipping" | "tax";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "revenue", label: "Revenue & payments" },
  { id: "expenses", label: "Expenses" },
  { id: "payables", label: "Accounts payable" },
  { id: "refunds", label: "Refunds" },
  { id: "shipping", label: "Courier costs" },
  { id: "tax", label: "Tax & VAT" },
];

const CATEGORY_LABELS: Record<string, string> = {
  procurement: "Procurement",
  shipping: "Shipping & couriers",
  marketing: "Marketing",
  payroll: "Payroll",
  operations: "Operations",
  refunds: "Refunds",
  other: "Other",
};

export function FinanceDashboard({
  data,
  canManage,
}: {
  data: FinanceDashboardData;
  canManage: boolean;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const { summary } = data;
  const cur = summary.currency;
  const maxDayRev = Math.max(...summary.revenueByDay.map((d) => d.revenue), 1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Gross revenue"
              value={formatCurrency(summary.grossRevenue, cur)}
              change={12.4}
              icon={<TrendingUp className="h-4 w-4" />}
              accent="bg-brand"
              hint={`${summary.orderCount} orders · AOV ${formatCurrency(summary.avgOrderValue, cur)}`}
            />
            <StatCard
              label="Net profit"
              value={formatCurrency(summary.netProfit, cur)}
              change={summary.netMarginPct}
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
              change={summary.netCashFlow >= 0 ? 8 : -8}
              icon={<Banknote className="h-4 w-4" />}
              accent={summary.netCashFlow >= 0 ? "bg-emerald-600" : "bg-red-600"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="Profit & loss" description={summary.periodLabel} className="lg:col-span-2">
              <dl className="divide-y divide-neutral-100">
                <PlRow label="Gross revenue" value={formatCurrency(summary.grossRevenue, cur)} />
                <PlRow label="Refunds issued" value={`−${formatCurrency(summary.refundsIssued, cur)}`} negative />
                <PlRow label="Net revenue" value={formatCurrency(summary.netRevenue, cur)} bold />
                <PlRow label="Cost of goods sold (COGS)" value={`−${formatCurrency(summary.cogs, cur)}`} negative />
                <PlRow
                  label={`Gross profit (${summary.grossMarginPct}%)`}
                  value={formatCurrency(summary.grossProfit, cur)}
                  bold
                />
                <PlRow label="Shipping & couriers" value={`−${formatCurrency(summary.shippingCosts, cur)}`} negative />
                <PlRow label="Marketing" value={`−${formatCurrency(summary.marketingSpend, cur)}`} negative />
                <PlRow label="Payroll" value={`−${formatCurrency(summary.payroll, cur)}`} negative />
                <PlRow label="Other operating" value={`−${formatCurrency(summary.otherExpenses, cur)}`} negative />
                <PlRow
                  label={`Net profit (${summary.netMarginPct}%)`}
                  value={formatCurrency(summary.netProfit, cur)}
                  bold
                  highlight
                />
              </dl>
            </Panel>

            <Panel title="Alerts & obligations">
              <ul className="divide-y divide-neutral-100">
                <AlertRow
                  icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
                  label="Pending payables"
                  value={formatCurrency(summary.pendingPayables, cur)}
                  href="/admin/finance"
                  onClick={() => setTab("payables")}
                />
                <AlertRow
                  icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                  label="Overdue invoices"
                  value={formatCurrency(summary.overduePayables, cur)}
                  urgent={summary.overduePayables > 0}
                  onClick={() => setTab("payables")}
                />
                <AlertRow
                  icon={<CreditCard className="h-4 w-4 text-neutral-400" />}
                  label="Outstanding refunds"
                  value={formatCurrency(summary.outstandingRefunds, cur)}
                  onClick={() => setTab("refunds")}
                />
                <AlertRow
                  icon={<Receipt className="h-4 w-4 text-neutral-400" />}
                  label="VAT collected"
                  value={formatCurrency(summary.vatCollected, cur)}
                  onClick={() => setTab("tax")}
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
      )}

      {tab === "revenue" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Gross revenue" value={formatCurrency(summary.grossRevenue, cur)} accent="bg-brand" />
            <StatCard label="Orders" value={String(summary.orderCount)} accent="bg-neutral-800" />
            <StatCard
              label="Avg order value"
              value={formatCurrency(summary.avgOrderValue, cur)}
              accent="bg-emerald-600"
            />
          </div>

          <Panel title="Revenue by payment method">
            <Table>
              <thead>
                <tr>
                  <Th>Method</Th>
                  <Th>Orders</Th>
                  <Th>Share</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {summary.revenueByPayment.map((p) => (
                  <tr key={p.method}>
                    <Td className="font-medium">{p.method}</Td>
                    <Td>{p.count}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-100">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${p.sharePct}%` }} />
                        </div>
                        <span className="text-xs text-neutral-500">{p.sharePct}%</span>
                      </div>
                    </Td>
                    <Td className="text-right font-semibold">{formatCurrency(p.amount, cur)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>

          <Panel title="Recent order payments">
            <Table>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <Td>
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:text-brand">
                        {o.orderNumber}
                      </Link>
                    </Td>
                    <Td>{o.customerName}</Td>
                    <Td className="text-neutral-600">{o.paymentMethod ?? "—"}</Td>
                    <Td><StatusBadge status={o.status} /></Td>
                    <Td className="text-right font-semibold">{formatCurrency(o.total, cur)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        </>
      )}

      {tab === "expenses" && (
        <ExpensesTab expenses={data.expenses} canManage={canManage} currency={cur} />
      )}

      {tab === "payables" && (
        <PayablesTab payables={data.payables} canManage={canManage} currency={cur} />
      )}

      {tab === "refunds" && (
        <RefundsTab returns={data.returns} canManage={canManage} currency={cur} />
      )}

      {tab === "shipping" && (
        <>
          <StatCard
            label="Total internal courier cost"
            value={formatCurrency(summary.shippingCosts, cur)}
            icon={<Truck className="h-4 w-4" />}
            accent="bg-neutral-800"
            hint="Embedded in product prices where configured — tracked here for margin analysis"
          />
          <Panel title="Cost by courier" description="Internal logistics cost vs customer charge">
            <Table>
              <thead>
                <tr>
                  <Th>Courier</Th>
                  <Th>Shipments</Th>
                  <Th>Customer charge</Th>
                  <Th className="text-right">Internal cost</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {summary.courierCosts.map((c) => (
                  <tr key={c.courier}>
                    <Td className="font-medium">{c.courier}</Td>
                    <Td>{c.shipments}</Td>
                    <Td className="text-emerald-600">
                      {c.customerCharge === 0 ? "Free (embedded)" : formatCurrency(c.customerCharge, cur)}
                    </Td>
                    <Td className="text-right font-semibold text-red-600">
                      {formatCurrency(c.internalCost, cur)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>
        </>
      )}

      {tab === "tax" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              label="VAT collected"
              value={formatCurrency(summary.vatCollected, cur)}
              accent="bg-brand"
              hint={`${(summary.vatRate * 100).toFixed(0)}% rate on taxable sales`}
            />
            <StatCard
              label="Taxable revenue (ex VAT)"
              value={formatCurrency(summary.grossRevenue - summary.vatCollected, cur)}
              accent="bg-neutral-800"
            />
            <StatCard
              label="Net revenue (after refunds)"
              value={formatCurrency(summary.netRevenue, cur)}
              accent="bg-emerald-600"
            />
          </div>
          <Panel title="VAT summary" description="South African VAT reporting basis">
            <dl className="divide-y divide-neutral-100 px-5">
              <PlRow label="Gross sales (incl. VAT)" value={formatCurrency(summary.grossRevenue, cur)} />
              <PlRow label="Output VAT collected" value={formatCurrency(summary.vatCollected, cur)} bold />
              <PlRow label="Refunds (reduce taxable base)" value={`−${formatCurrency(summary.refundsIssued, cur)}`} negative />
              <PlRow
                label="Estimated VAT liability"
                value={formatCurrency(summary.vatCollected * 0.92, cur)}
                bold
                highlight
              />
            </dl>
            <p className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-400">
              Consult your accountant before filing. Input VAT on expenses is not auto-calculated in demo mode.
            </p>
          </Panel>
        </>
      )}
    </div>
  );
}

function PlRow({
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

function AlertRow({
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

function ExpensesTab({
  expenses,
  canManage,
  currency,
}: {
  expenses: Expense[];
  canManage: boolean;
  currency: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    label: "",
    category: "operations",
    amount: "",
    vendor: "",
    notes: "",
  });
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  async function addExpense(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number(form.amount),
        currency,
      }),
    });
    setForm({ label: "", category: "operations", amount: "", vendor: "", notes: "" });
    router.refresh();
  }

  return (
    <>
      <StatCard label="Total recorded expenses" value={formatCurrency(total, currency)} accent="bg-red-600" />
      {canManage && (
        <Panel title="Record expense">
          <form onSubmit={addExpense} className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <input
              className="input sm:col-span-2"
              placeholder="Description"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              placeholder="Amount (ZAR)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Vendor / payee"
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
            <input
              className="input sm:col-span-2"
              placeholder="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
              <BtnPrimary type="submit">Record expense</BtnPrimary>
            </div>
          </form>
        </Panel>
      )}
      <Panel title="Expense ledger">
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Category</Th>
              <Th>Vendor</Th>
              <Th>Recorded by</Th>
              <Th className="text-right">Amount</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {expenses.map((e) => (
              <tr key={e.id}>
                <Td className="text-neutral-500">
                  {new Date(e.recordedAt).toLocaleDateString("en-ZA")}
                </Td>
                <Td>
                  <p className="font-medium">{e.label}</p>
                  {e.notes && <p className="text-xs text-neutral-400">{e.notes}</p>}
                </Td>
                <Td><StatusBadge status={e.category} /></Td>
                <Td className="text-neutral-500">{e.vendor ?? "—"}</Td>
                <Td className="text-neutral-500">{e.recordedBy}</Td>
                <Td className="text-right font-semibold text-red-600">
                  {formatCurrency(e.amount, e.currency)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}

function PayablesTab({
  payables,
  canManage,
  currency,
}: {
  payables: SupplierPayable[];
  canManage: boolean;
  currency: string;
}) {
  const router = useRouter();
  const pending = payables.filter((p) => p.status !== "paid" && p.status !== "cancelled");
  const totalPending = pending.reduce((s, p) => s + p.amount, 0);

  async function markPaid(id: string) {
    await fetch("/api/admin/finance/payables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "paid" }),
    });
    router.refresh();
  }

  async function approve(id: string) {
    await fetch("/api/admin/finance/payables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved" }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Outstanding payables" value={formatCurrency(totalPending, currency)} accent="bg-amber-600" />
        <StatCard
          label="Overdue"
          value={formatCurrency(
            payables.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0),
            currency,
          )}
          accent="bg-red-600"
        />
      </div>
      <Panel title="Supplier invoices & payables">
        <Table>
          <thead>
            <tr>
              <Th>Invoice</Th>
              <Th>Vendor</Th>
              <Th>Due</Th>
              <Th>Order</Th>
              <Th>Status</Th>
              <Th className="text-right">Amount</Th>
              {canManage && <Th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {payables.map((p) => (
              <tr key={p.id}>
                <Td className="font-mono text-xs">{p.invoiceNumber}</Td>
                <Td className="font-medium">{p.vendor}</Td>
                <Td className={p.status === "overdue" ? "font-semibold text-red-600" : "text-neutral-500"}>
                  {new Date(p.dueDate).toLocaleDateString("en-ZA")}
                </Td>
                <Td>
                  {p.orderNumber ? (
                    <Link href={`/admin/orders/${p.orderId ?? ""}`} className="text-brand hover:underline">
                      {p.orderNumber}
                    </Link>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td><StatusBadge status={p.status} /></Td>
                <Td className="text-right font-semibold">{formatCurrency(p.amount, p.currency)}</Td>
                {canManage && (
                  <Td>
                    <div className="flex justify-end gap-2">
                      {p.status === "pending" && (
                        <button type="button" onClick={() => approve(p.id)} className="text-xs font-semibold text-brand">
                          Approve
                        </button>
                      )}
                      {(p.status === "approved" || p.status === "overdue") && (
                        <button type="button" onClick={() => markPaid(p.id)} className="text-xs font-semibold text-emerald-600">
                          Mark paid
                        </button>
                      )}
                    </div>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}

function RefundsTab({
  returns,
  canManage,
  currency,
}: {
  returns: ReturnRequest[];
  canManage: boolean;
  currency: string;
}) {
  const router = useRouter();
  const refunded = returns.filter((r) => r.status === "refunded").reduce((s, r) => s + r.refundAmount, 0);
  const pending = returns.filter((r) => r.status === "requested" || r.status === "approved");

  async function update(id: string, status: ReturnRequest["status"], refundAmount?: number) {
    await fetch("/api/admin/returns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, refundAmount }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Refunds processed" value={formatCurrency(refunded, currency)} accent="bg-red-600" />
        <StatCard label="Pending refund queue" value={String(pending.length)} accent="bg-amber-600" />
      </div>
      <Panel title="Return & refund queue">
        <Table>
          <thead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Reason</Th>
              <Th>Status</Th>
              <Th className="text-right">Refund</Th>
              {canManage && <Th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {returns.map((r) => (
              <tr key={r.id}>
                <Td className="font-semibold">{r.orderNumber}</Td>
                <Td>
                  <p>{r.customerName}</p>
                  <p className="text-xs text-neutral-400">{r.customerEmail}</p>
                </Td>
                <Td className="max-w-xs truncate text-neutral-600">{r.reason}</Td>
                <Td><StatusBadge status={r.status} /></Td>
                <Td className="text-right font-semibold">
                  {r.refundAmount ? formatCurrency(r.refundAmount, r.currency) : "—"}
                </Td>
                {canManage && (
                  <Td>
                    <div className="flex justify-end gap-2">
                      {r.status === "requested" && (
                        <button type="button" onClick={() => update(r.id, "approved", r.refundAmount || 500)} className="text-xs font-semibold text-brand">
                          Approve
                        </button>
                      )}
                      {r.status === "approved" && (
                        <button type="button" onClick={() => update(r.id, "refunded", r.refundAmount || 500)} className="text-xs font-semibold text-emerald-600">
                          Process refund
                        </button>
                      )}
                    </div>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
