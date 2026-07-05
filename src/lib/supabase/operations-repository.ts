export {
  db,
  tbl,
  asRows,
  asRow,
  DEFAULT_SUPPLIERS,
} from "@/lib/supabase/operations-repository-shared";

export {
  listProcurement,
  listProcurementByOrder,
  createProcurement,
  updateProcurement,
  ensureProcurementForOrder,
  ensureProcurementForSupabaseOrder,
  receiveProcurement,
} from "@/lib/supabase/operations-repository-procurement";

export {
  listInventory,
  updateInventory,
} from "@/lib/supabase/operations-repository-inventory";

export {
  listReturns,
  getReturn,
  listReturnsByOrder,
  listReturnsByEmail,
  createReturn,
  updateReturn,
  addReturnNote,
} from "@/lib/supabase/operations-repository-returns";

export type { CreateReturnInput } from "@/lib/admin/operations-store";

export {
  listItemRequests,
  getItemRequest,
  createItemRequest,
  updateItemRequest,
} from "@/lib/supabase/operations-repository-item-requests";

export {
  listExpenses,
  createExpense,
  listPayables,
  createPayable,
  updatePayable,
} from "@/lib/supabase/operations-repository-finance";

export {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "@/lib/supabase/operations-repository-campaigns";

export {
  listEmailSubscribers,
  addEmailSubscriber,
  removeEmailSubscriber,
  updateEmailSubscriber,
  listEmailBroadcasts,
  createEmailBroadcast,
  updateEmailBroadcast,
} from "@/lib/supabase/operations-repository-email";

export {
  getAnalytics,
  recordPageVisit,
} from "@/lib/supabase/operations-repository-analytics";

export {
  listChatSessions,
  getChatSession,
  createChatSession,
  appendChatMessage,
  closeChatSession,
} from "@/lib/supabase/operations-repository-chat";
