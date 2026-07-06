import { isSupabaseConfigured } from "@/lib/supabase/admin";
import * as store from "@/lib/admin/operations-store";
import * as repo from "@/lib/supabase/operations-repository";

export type { CreateReturnInput } from "@/lib/admin/operations-store";

export function canUseSupabaseOps(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function withRepo<T>(fn: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  if (!canUseSupabaseOps()) return fallback();
  try {
    return await fn();
  } catch (err) {
    console.error("[operations-persistence]", err);
    return await fallback();
  }
}

// Procurement
export const listProcurement = () => withRepo(repo.listProcurement, store.listProcurement);
export const listProcurementByOrder = (orderId: string, orderNumber?: string) =>
  withRepo(() => repo.listProcurementByOrder(orderId, orderNumber), () =>
    store.listProcurementByOrder(orderId, orderNumber),
  );
export const createProcurement = (input: Parameters<typeof store.createProcurement>[0]) =>
  withRepo(() => repo.createProcurement(input), () => store.createProcurement(input));
export const updateProcurement = (id: string, patch: Parameters<typeof store.updateProcurement>[1]) =>
  withRepo(() => repo.updateProcurement(id, patch), () => store.updateProcurement(id, patch));
export const ensureProcurementForOrder = (order: Parameters<typeof store.ensureProcurementForOrder>[0]) =>
  withRepo(() => repo.ensureProcurementForOrder(order), () => store.ensureProcurementForOrder(order));
export const ensureProcurementForSupabaseOrder = (orderId: string) =>
  withRepo(() => repo.ensureProcurementForSupabaseOrder(orderId), async () => {
    const checkout = store.getCheckoutOrder(orderId);
    return checkout ? store.ensureProcurementForOrder(checkout) : [];
  });
export const receiveProcurement = (id: string) =>
  withRepo(() => repo.receiveProcurement(id), () => store.receiveProcurement(id));

// Inventory
export const listInventory = () => withRepo(repo.listInventory, store.listInventory);
export const updateInventory = (productId: string, patch: Parameters<typeof store.updateInventory>[1]) =>
  withRepo(() => repo.updateInventory(productId, patch), () => store.updateInventory(productId, patch));

// Returns
export const listReturns = () => withRepo(repo.listReturns, store.listReturns);
export const getReturn = (id: string) =>
  withRepo(() => repo.getReturn(id), () => store.getReturn(id));
export const listReturnsByOrder = (orderId: string) =>
  withRepo(() => repo.listReturnsByOrder(orderId), () => store.listReturnsByOrder(orderId));
export const listReturnsByEmail = (email: string) =>
  withRepo(() => repo.listReturnsByEmail(email), () => store.listReturnsByEmail(email));
export const createReturn = (input: store.CreateReturnInput) =>
  withRepo(() => repo.createReturn(input), () => store.createReturn(input));
export const updateReturn = (id: string, patch: Parameters<typeof store.updateReturn>[1]) =>
  withRepo(() => repo.updateReturn(id, patch), () => store.updateReturn(id, patch));
export const addReturnNote = (
  returnId: string,
  note: Parameters<typeof store.addReturnNote>[1],
) => withRepo(() => repo.addReturnNote(returnId, note), () => store.addReturnNote(returnId, note));

// Item requests
export const listItemRequests = () => withRepo(repo.listItemRequests, store.listItemRequests);
export const getItemRequest = (id: string) =>
  withRepo(() => repo.getItemRequest(id), () => store.getItemRequest(id));
export const createItemRequest = (input: Parameters<typeof store.createItemRequest>[0]) =>
  withRepo(() => repo.createItemRequest(input), () => store.createItemRequest(input));
export const updateItemRequest = (id: string, patch: Parameters<typeof store.updateItemRequest>[1]) =>
  withRepo(() => repo.updateItemRequest(id, patch), () => store.updateItemRequest(id, patch));

// Finance
export const listExpenses = () => withRepo(repo.listExpenses, store.listExpenses);
export const createExpense = (input: Parameters<typeof store.createExpense>[0]) =>
  withRepo(() => repo.createExpense(input), () => store.createExpense(input));
export const listPayables = () => withRepo(repo.listPayables, store.listPayables);
export const createPayable = (input: Parameters<typeof store.createPayable>[0]) =>
  withRepo(() => repo.createPayable(input), () => store.createPayable(input));
export const updatePayable = (id: string, patch: Parameters<typeof store.updatePayable>[1]) =>
  withRepo(() => repo.updatePayable(id, patch), () => store.updatePayable(id, patch));

// Marketing
export const listCampaigns = () => withRepo(repo.listCampaigns, store.listCampaigns);
export const createCampaign = (input: Parameters<typeof store.createCampaign>[0]) =>
  withRepo(() => repo.createCampaign(input), () => store.createCampaign(input));
export const updateCampaign = (id: string, patch: Parameters<typeof store.updateCampaign>[1]) =>
  withRepo(() => repo.updateCampaign(id, patch), () => store.updateCampaign(id, patch));
export const deleteCampaign = async (id: string) => {
  if (!canUseSupabaseOps()) {
    store.deleteCampaign(id);
    return;
  }
  try {
    await repo.deleteCampaign(id);
  } catch {
    store.deleteCampaign(id);
  }
};

export const listPromoCodes = () => withRepo(repo.listPromoCodes, store.listPromoCodes);
export const getPromoByCode = (code: string) =>
  withRepo(() => repo.getPromoByCode(code), () => store.getPromoByCode(code));
export const createPromoCode = (input: Parameters<typeof store.createPromoCode>[0]) =>
  withRepo(() => repo.createPromoCode(input), () => store.createPromoCode(input));
export const updatePromoCode = (id: string, patch: Parameters<typeof store.updatePromoCode>[1]) =>
  withRepo(() => repo.updatePromoCode(id, patch), () => store.updatePromoCode(id, patch));
export const deletePromoCode = async (id: string) => {
  if (!canUseSupabaseOps()) {
    store.deletePromoCode(id);
    return;
  }
  try {
    await repo.deletePromoCode(id);
  } catch {
    store.deletePromoCode(id);
  }
};
export const incrementPromoUsage = (id: string) =>
  withRepo(() => repo.incrementPromoUsage(id), () => store.incrementPromoUsage(id));
export const listEmailSubscribers = () =>
  withRepo(repo.listEmailSubscribers, store.listEmailSubscribers);
export const addEmailSubscriber = (input: Parameters<typeof store.addEmailSubscriber>[0]) =>
  withRepo(() => repo.addEmailSubscriber(input), () => store.addEmailSubscriber(input));
export const removeEmailSubscriber = (id: string) =>
  withRepo(() => repo.removeEmailSubscriber(id), () => store.removeEmailSubscriber(id));
export const updateEmailSubscriber = (id: string, patch: Parameters<typeof store.updateEmailSubscriber>[1]) =>
  withRepo(() => repo.updateEmailSubscriber(id, patch), () => store.updateEmailSubscriber(id, patch));
export const listEmailBroadcasts = () =>
  withRepo(repo.listEmailBroadcasts, store.listEmailBroadcasts);
export const createEmailBroadcast = (input: Parameters<typeof store.createEmailBroadcast>[0]) =>
  withRepo(() => repo.createEmailBroadcast(input), () => store.createEmailBroadcast(input));
export const updateEmailBroadcast = (id: string, patch: Parameters<typeof store.updateEmailBroadcast>[1]) =>
  withRepo(() => repo.updateEmailBroadcast(id, patch), () => store.updateEmailBroadcast(id, patch));

// Analytics
export const getAnalytics = () => withRepo(repo.getAnalytics, store.getAnalytics);
export const recordPageVisit = async (path: string) => {
  if (!canUseSupabaseOps()) {
    store.recordPageVisit(path);
    return;
  }
  try {
    await repo.recordPageVisit(path);
  } catch {
    store.recordPageVisit(path);
  }
};

// Live chat
export const listChatSessions = () => withRepo(repo.listChatSessions, async () => {
  const { listChatSessions: memList } = await import("@/lib/admin/chat-store");
  return memList();
});
export const getChatSession = (id: string) =>
  withRepo(() => repo.getChatSession(id), async () => {
    const { getChatSession: memGet } = await import("@/lib/admin/chat-store");
    return memGet(id);
  });
export const createChatSession = (input: Parameters<typeof repo.createChatSession>[0]) =>
  withRepo(() => repo.createChatSession(input), async () => {
    const { createChatSession: memCreate } = await import("@/lib/admin/chat-store");
    return memCreate(input);
  });
export const appendChatMessage = (
  sessionId: string,
  input: Parameters<typeof repo.appendChatMessage>[1],
) =>
  withRepo(() => repo.appendChatMessage(sessionId, input), async () => {
    const { appendChatMessage: memAppend } = await import("@/lib/admin/chat-store");
    return memAppend(sessionId, input);
  });
export const closeChatSession = (sessionId: string) =>
  withRepo(() => repo.closeChatSession(sessionId), async () => {
    const { closeChatSession: memClose } = await import("@/lib/admin/chat-store");
    return memClose(sessionId);
  });

// Checkout orders & config remain in-memory / platform_settings
export {
  listCheckoutOrders,
  getCheckoutOrder,
  createCheckoutOrder,
  updateCheckoutOrder,
  getExtendedConfig,
  updateExtendedConfig,
  listCustomProducts,
  getCustomProduct,
  createCustomProduct,
  updateCustomProduct,
  listOpsTickets,
  getOpsTicketMessages,
  addTicketMessage,
  updateSupportTicket,
  createSupportTicket,
  getStaffOverrides,
  updateStaffAccess,
} from "@/lib/admin/operations-store";
