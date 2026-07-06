import type { SupplierPayable } from "@/lib/admin/finance-types";
import type {
  AdminProductDraft,
  Campaign,
  PromoCode,
  CheckoutOrderRecord,
  CustomerItemRequest,
  EmailBroadcast,
  EmailSubscriber,
  Expense,
  ExtendedPlatformConfig,
  InventoryRecord,
  ProcurementRecord,
  ReturnRequest,
  SiteAnalytics,
} from "@/lib/admin/operations-types";
import type { SupportTicket, TicketMessage } from "@/types/database";
import {
  seedCampaigns,
  seedConfigAndStaff,
  seedEmailBroadcasts,
  seedEmailSubscribers,
  seedExpenses,
  seedPayables,
  type StaffAccessOverride,
} from "@/lib/admin/operations-store-seed-a";
import { seedPromoCodes } from "@/lib/admin/operations-store-seed-promos";
import {
  seedAnalytics,
  seedEmptyCollections,
  seedInventory,
  seedItemRequests,
  seedProcurement,
  seedReturns,
  seedTickets,
} from "@/lib/admin/operations-store-seed-b";

export type { StaffAccessOverride };

export function iso(daysAgo = 0, hoursAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hoursAgo);
  return d.toISOString();
}

export function ticketNum() {
  return `TKT-${10400 + Math.floor(Math.random() * 900)}`;
}

export interface OperationsState {
  campaigns: Campaign[];
  promoCodes: PromoCode[];
  emailSubscribers: EmailSubscriber[];
  emailBroadcasts: EmailBroadcast[];
  expenses: Expense[];
  returns: ReturnRequest[];
  itemRequests: CustomerItemRequest[];
  procurement: ProcurementRecord[];
  inventory: InventoryRecord[];
  customProducts: AdminProductDraft[];
  checkoutOrders: CheckoutOrderRecord[];
  payables: SupplierPayable[];
  staffOverrides: Record<string, StaffAccessOverride>;
  deletedStaffIds: string[];
  tickets: SupportTicket[];
  ticketMessages: Record<string, TicketMessage[]>;
  analytics: SiteAnalytics;
  config: ExtendedPlatformConfig;
}

const initial: OperationsState = {
  ...seedConfigAndStaff(),
  campaigns: seedCampaigns(iso),
  promoCodes: seedPromoCodes(iso),
  emailSubscribers: seedEmailSubscribers(iso),
  emailBroadcasts: seedEmailBroadcasts(iso),
  expenses: seedExpenses(iso),
  payables: seedPayables(iso),
  returns: seedReturns(iso),
  itemRequests: seedItemRequests(iso),
  procurement: seedProcurement(iso),
  inventory: seedInventory(iso),
  ...seedEmptyCollections(),
  ...seedTickets(),
  analytics: seedAnalytics(iso),
};

export const state: OperationsState = structuredClone(initial);

export function getOperationsState() {
  return state;
}
