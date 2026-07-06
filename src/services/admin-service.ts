/**
 * Admin data access layer. Every function reads from Supabase when configured
 * and otherwise returns rich demo data, so the admin panel is fully explorable
 * in local development and degrades gracefully in production outages.
 */

export { isAdminLiveMode, getCurrentStaff, getStaffProfile, saveStaffAccess } from "./admin/session";
export { listStaff, deleteStaffMember, listActivity } from "./admin/staff";
export { getDashboardStats, getReportsSummary } from "./admin/dashboard";
export { listAdminProducts, getAdminProduct } from "./admin/products";
export { listCustomers, getCustomer, getCustomerOrders } from "./admin/customers";
export {
  listAdminOrders,
  getFulfillmentQueue,
  getOrderProcurement,
} from "./admin/orders";
export { getAdminOrder } from "./admin/order-detail";
export { listTickets, getTicket } from "./admin/tickets";
export {
  getFinanceDashboard,
  listCampaigns,
  listExpenses,
  listPayables,
  listReturns,
  listProcurement,
  listInventory,
  getAnalytics,
} from "./admin/finance";
export {
  getSettings,
  getPlatformExtendedConfig,
  listAdminCouriers,
} from "./admin/settings";
export { getAdminNotificationSummary } from "./admin/notifications";
export { listAllSellers, getSellerAdminDetail, updateSellerStatus, updatePayoutStatus } from "./admin/sellers";
export type {
  AdminOrderSummary,
  AdminOrderLineItem,
  AdminOrderDetail,
  DashboardStats,
  ReportsSummary,
} from "./admin/types";

export {
  getExtendedConfig,
  updateExtendedConfig,
} from "@/lib/admin/operations-persistence";
