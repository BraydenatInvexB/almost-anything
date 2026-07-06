import { mapSellerDocument, mapSellerPayout, mapSellerRow } from "@/lib/seller/seller-mapper";
import { sellerDb } from "@/lib/seller/db";
import type { SellerDocument, SellerPayout, SellerProfile, SellerStatus } from "@/types/seller";

import type { SellerDeskFilter } from "@/types/seller-admin";

export async function countPendingSellerApplications(): Promise<number> {
  const { count, error } = await sellerDb()
    .from("sellers")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review");

  if (error) throw error;
  return count ?? 0;
}

export async function listAllSellers(filter: SellerDeskFilter = "all"): Promise<SellerProfile[]> {
  let query = sellerDb().from("sellers").select("*").order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map((row) => mapSellerRow(row as Record<string, unknown>));
}

export async function getSellerAdminDetail(id: string): Promise<{
  seller: SellerProfile;
  documents: SellerDocument[];
  payouts: SellerPayout[];
} | null> {
  const db = sellerDb();
  const { data: seller, error: sellerError } = await db
    .from("sellers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (sellerError) throw sellerError;
  if (!seller) return null;

  const [{ data: documents, error: docsError }, { data: payouts, error: payoutsError }] =
    await Promise.all([
      db.from("seller_documents").select("*").eq("seller_id", id).order("uploaded_at", { ascending: false }),
      db.from("seller_payouts").select("*").eq("seller_id", id).order("requested_at", { ascending: false }),
    ]);

  if (docsError) throw docsError;
  if (payoutsError) throw payoutsError;

  return {
    seller: mapSellerRow(seller as Record<string, unknown>),
    documents: (documents ?? []).map((row) => mapSellerDocument(row as Record<string, unknown>)),
    payouts: (payouts ?? []).map((row) => mapSellerPayout(row as Record<string, unknown>)),
  };
}

export async function updateSellerStatus(
  id: string,
  status: SellerStatus,
  notes?: string,
): Promise<void> {
  const { error } = await sellerDb()
    .from("sellers")
    .update({
      status,
      metadata: notes ? { adminNotes: notes } : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}

export async function updatePayoutStatus(
  payoutId: string,
  status: SellerPayout["status"],
  staffUserId?: string,
): Promise<void> {
  const { error } = await sellerDb()
    .from("seller_payouts")
    .update({
      status,
      processed_at: status === "paid" || status === "rejected" ? new Date().toISOString() : null,
      processed_by: staffUserId ?? null,
    })
    .eq("id", payoutId);

  if (error) throw error;
}
