import { listCheckoutOrders } from "@/lib/admin/operations-store";
import {
  listExpenses,
  listPayables,
  listReturns,
  listProcurement,
} from "@/lib/admin/operations-persistence";
import { buildFinanceSummary } from "@/lib/admin/finance-summary";
import type { FinanceDashboardData } from "@/lib/admin/finance-types";
import { listAdminOrders } from "./orders";
import { getSettings } from "./settings";

export async function getFinanceDashboard(): Promise<FinanceDashboardData> {
  const [orders, settings, expenses, returns, procurement, payables] = await Promise.all([
    listAdminOrders(),
    getSettings(),
    listExpenses(),
    listReturns(),
    listProcurement(),
    listPayables(),
  ]);
  const checkoutOrders = listCheckoutOrders();

  const summary = buildFinanceSummary({
    orders,
    checkoutOrders,
    expenses,
    returns,
    procurement,
    payables,
    taxRate: Number(settings.tax_rate) || 0.15,
    currency: settings.currency ?? "ZAR",
  });

  return {
    summary,
    expenses,
    payables,
    returns,
    recentOrders: orders.slice(0, 20).map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      total: o.total,
      paymentMethod: o.paymentMethod,
      status: o.status,
      createdAt: o.createdAt,
    })),
  };
}

export {
  listCampaigns,
  listExpenses,
  listPayables,
  listReturns,
  listProcurement,
  listInventory,
  getAnalytics,
} from "@/lib/admin/operations-persistence";
