import type { ExpenseCategory } from "@/lib/admin/operations-types";

export type PayableStatus = "pending" | "approved" | "paid" | "overdue" | "cancelled";

export interface SupplierPayable {
  id: string;
  invoiceNumber: string;
  vendor: string;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  dueDate: string;
  status: PayableStatus;
  orderId?: string;
  orderNumber?: string;
  procurementId?: string;
  notes?: string;
  createdAt: string;
  paidAt?: string;
}

export interface RevenueByPayment {
  method: string;
  amount: number;
  count: number;
  sharePct: number;
}

export interface RevenueByDay {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface ExpenseByCategory {
  category: ExpenseCategory;
  amount: number;
  sharePct: number;
}

export interface CourierCostRow {
  courier: string;
  shipments: number;
  internalCost: number;
  customerCharge: number;
}

export interface FinanceSummary {
  currency: string;
  periodLabel: string;

  grossRevenue: number;
  refundsIssued: number;
  netRevenue: number;

  cogs: number;
  grossProfit: number;
  grossMarginPct: number;

  operatingExpenses: number;
  shippingCosts: number;
  marketingSpend: number;
  payroll: number;
  otherExpenses: number;

  netProfit: number;
  netMarginPct: number;

  cashIn: number;
  cashOut: number;
  netCashFlow: number;

  vatCollected: number;
  vatRate: number;

  orderCount: number;
  avgOrderValue: number;
  pendingPayables: number;
  overduePayables: number;
  outstandingRefunds: number;

  revenueByPayment: RevenueByPayment[];
  revenueByDay: RevenueByDay[];
  expensesByCategory: ExpenseByCategory[];
  courierCosts: CourierCostRow[];
}

export interface FinanceDashboardData {
  summary: FinanceSummary;
  expenses: import("@/lib/admin/operations-types").Expense[];
  payables: SupplierPayable[];
  returns: import("@/lib/admin/operations-types").ReturnRequest[];
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    paymentMethod?: string;
    status: string;
    createdAt: string;
  }>;
}
