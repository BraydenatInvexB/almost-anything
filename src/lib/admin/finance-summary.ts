import type { AdminOrderSummary } from "@/services/admin-service";
import type {
  CheckoutOrderRecord,
  Expense,
  ExpenseCategory,
  ProcurementRecord,
  ReturnRequest,
} from "@/lib/admin/operations-types";
import type {
  CourierCostRow,
  ExpenseByCategory,
  FinanceSummary,
  RevenueByDay,
  RevenueByPayment,
  SupplierPayable,
} from "@/lib/admin/finance-types";

const COURIER_INTERNAL: Record<string, number> = {
  "The Courier Guy": 95,
  Fastway: 75,
  Aramex: 89,
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function formatDayLabel(key: string) {
  const d = new Date(key);
  return d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short" });
}

function sumExpensesByCategory(expenses: Expense[], category: ExpenseCategory) {
  return expenses.filter((e) => e.category === category).reduce((s, e) => s + e.amount, 0);
}

export function buildFinanceSummary(input: {
  orders: AdminOrderSummary[];
  checkoutOrders: CheckoutOrderRecord[];
  expenses: Expense[];
  returns: ReturnRequest[];
  procurement: ProcurementRecord[];
  payables: SupplierPayable[];
  taxRate: number;
  currency?: string;
}): FinanceSummary {
  const currency = input.currency ?? "ZAR";
  const activeOrders = input.orders.filter((o) => o.status !== "cancelled");

  const grossRevenue = activeOrders.reduce((s, o) => s + o.total, 0);
  const refundExpenseLines = sumExpensesByCategory(input.expenses, "refunds");
  const refundsIssued =
    input.returns.filter((r) => r.status === "refunded").reduce((s, r) => s + r.refundAmount, 0) +
    refundExpenseLines;
  const netRevenue = grossRevenue - refundsIssued;

  const cogs = input.procurement
    .filter((p) => p.status !== "cancelled")
    .reduce((s, p) => s + p.costPrice, 0);

  const grossProfit = netRevenue - cogs;
  const grossMarginPct = netRevenue > 0 ? Number(((grossProfit / netRevenue) * 100).toFixed(1)) : 0;

  const shippingCosts =
    sumExpensesByCategory(input.expenses, "shipping") +
    input.checkoutOrders.reduce((s, o) => s + o.shippingInternalCost, 0);

  const marketingSpend = sumExpensesByCategory(input.expenses, "marketing");
  const payroll = sumExpensesByCategory(input.expenses, "payroll");
  const procurementExpenses = sumExpensesByCategory(input.expenses, "procurement");
  const operationsExpenses = sumExpensesByCategory(input.expenses, "operations");
  const otherExpenses = sumExpensesByCategory(input.expenses, "other");

  const operatingExpenses =
    shippingCosts +
    marketingSpend +
    payroll +
    procurementExpenses +
    operationsExpenses +
    otherExpenses;

  const netProfit = netRevenue - cogs - operatingExpenses;
  const netMarginPct = netRevenue > 0 ? Number(((netProfit / netRevenue) * 100).toFixed(1)) : 0;

  const cashIn = netRevenue;
  const pendingPayables = input.payables
    .filter((p) => p.status === "pending" || p.status === "approved" || p.status === "overdue")
    .reduce((s, p) => s + p.amount, 0);
  const paidPayables = input.payables
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);
  const cashOut = operatingExpenses + paidPayables;
  const netCashFlow = cashIn - cashOut;

  const vatRate = input.taxRate;
  const vatCollected = activeOrders.reduce((s, o) => {
    const subtotal = o.total / (1 + vatRate);
    return s + (o.total - subtotal);
  }, 0);

  const orderCount = activeOrders.length;
  const avgOrderValue = orderCount > 0 ? Number((grossRevenue / orderCount).toFixed(2)) : 0;

  const overduePayables = input.payables
    .filter((p) => p.status === "overdue")
    .reduce((s, p) => s + p.amount, 0);

  const outstandingRefunds = input.returns
    .filter((r) => r.status === "approved" || r.status === "requested")
    .reduce((s, r) => s + (r.refundAmount || 0), 0);

  const paymentMap = new Map<string, { amount: number; count: number }>();
  for (const o of activeOrders) {
    const method = o.paymentMethod ?? "Unknown";
    const cur = paymentMap.get(method) ?? { amount: 0, count: 0 };
    paymentMap.set(method, { amount: cur.amount + o.total, count: cur.count + 1 });
  }
  const revenueByPayment: RevenueByPayment[] = Array.from(paymentMap.entries())
    .map(([method, data]) => ({
      method,
      amount: data.amount,
      count: data.count,
      sharePct: grossRevenue > 0 ? Number(((data.amount / grossRevenue) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const dayMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of activeOrders) {
    const key = dayKey(o.createdAt);
    const cur = dayMap.get(key) ?? { revenue: 0, orders: 0 };
    dayMap.set(key, { revenue: cur.revenue + o.total, orders: cur.orders + 1 });
  }
  const revenueByDay: RevenueByDay[] = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, data]) => ({
      date,
      label: formatDayLabel(date),
      revenue: data.revenue,
      orders: data.orders,
    }));

  const expenseCategories: ExpenseCategory[] = [
    "procurement",
    "shipping",
    "marketing",
    "payroll",
    "operations",
    "refunds",
    "other",
  ];
  const totalExpenseRecorded = input.expenses.reduce((s, e) => s + e.amount, 0);
  const expensesByCategory: ExpenseByCategory[] = expenseCategories
    .map((category) => {
      const amount = sumExpensesByCategory(input.expenses, category);
      return {
        category,
        amount,
        sharePct:
          totalExpenseRecorded > 0 ? Number(((amount / totalExpenseRecorded) * 100).toFixed(1)) : 0,
      };
    })
    .filter((e) => e.amount > 0);

  const courierMap = new Map<string, CourierCostRow>();
  for (const o of input.checkoutOrders) {
    const name = o.courierName;
    const cur = courierMap.get(name) ?? {
      courier: name,
      shipments: 0,
      internalCost: 0,
      customerCharge: 0,
    };
    courierMap.set(name, {
      courier: name,
      shipments: cur.shipments + 1,
      internalCost: cur.internalCost + o.shippingInternalCost,
      customerCharge: cur.customerCharge + o.shippingCost,
    });
  }
  for (const o of activeOrders) {
    if (input.checkoutOrders.some((c) => c.orderNumber === o.orderNumber)) continue;
    const name = o.courierName ?? "Aramex";
    const internal = COURIER_INTERNAL[name] ?? 85;
    const cur = courierMap.get(name) ?? {
      courier: name,
      shipments: 0,
      internalCost: 0,
      customerCharge: 0,
    };
    courierMap.set(name, {
      courier: name,
      shipments: cur.shipments + 1,
      internalCost: cur.internalCost + internal,
      customerCharge: cur.customerCharge + (o.total > 1000 ? 0 : 99),
    });
  }
  const courierCosts = Array.from(courierMap.values()).sort((a, b) => b.internalCost - a.internalCost);

  return {
    currency,
    periodLabel: "Last 30 days",
    grossRevenue,
    refundsIssued,
    netRevenue,
    cogs,
    grossProfit,
    grossMarginPct,
    operatingExpenses,
    shippingCosts,
    marketingSpend,
    payroll,
    otherExpenses: operationsExpenses + otherExpenses + procurementExpenses,
    netProfit,
    netMarginPct,
    cashIn,
    cashOut,
    netCashFlow,
    vatCollected: Number(vatCollected.toFixed(2)),
    vatRate,
    orderCount,
    avgOrderValue,
    pendingPayables,
    overduePayables,
    outstandingRefunds,
    revenueByPayment,
    revenueByDay,
    expensesByCategory,
    courierCosts,
  };
}
