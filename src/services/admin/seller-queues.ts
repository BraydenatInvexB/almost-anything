import { sellerDb } from "@/lib/seller/db";
import { getDocumentLabel } from "@/config/seller-document-requirements";
import { mapSellerDocument, mapSellerPayout } from "@/lib/seller/seller-mapper";
import type { SellerDocumentQueueRow, SellerPayoutQueueRow } from "@/types/seller-admin";

async function sellerNameMap(sellerIds: string[]) {
  if (!sellerIds.length) return {};
  const { data } = await sellerDb()
    .from("sellers")
    .select("id, shop_name, company_name")
    .in("id", sellerIds);
  return Object.fromEntries((data ?? []).map((row) => [String(row.id), row]));
}

export async function listSellerDocumentsQueue(
  status: "pending" | "all" = "pending",
): Promise<SellerDocumentQueueRow[]> {
  let query = sellerDb()
    .from("seller_documents")
    .select("id, seller_id, doc_type, file_name, file_url, status, uploaded_at, notes")
    .order("uploaded_at", { ascending: false });

  if (status === "pending") query = query.eq("status", "pending");

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const sellers = await sellerNameMap([...new Set(rows.map((row) => String(row.seller_id)))]);

  return rows.map((row) => {
    const doc = mapSellerDocument(row as Record<string, unknown>);
    const seller = sellers[doc.sellerId];
    return {
      id: doc.id,
      sellerId: doc.sellerId,
      sellerShopName: seller?.shop_name ? String(seller.shop_name) : "Unknown shop",
      sellerCompanyName: seller?.company_name ? String(seller.company_name) : "",
      docType: doc.docType,
      docLabel: getDocumentLabel(doc.docType),
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      status: doc.status,
      notes: doc.notes,
      uploadedAt: doc.uploadedAt,
    };
  });
}

export async function listSellerPayoutsQueue(
  status: "pending" | "all" = "pending",
): Promise<SellerPayoutQueueRow[]> {
  let query = sellerDb()
    .from("seller_payouts")
    .select("id, seller_id, amount, currency, status, requested_at, notes")
    .order("requested_at", { ascending: false });

  if (status === "pending") query = query.eq("status", "pending");

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const sellers = await sellerNameMap([...new Set(rows.map((row) => String(row.seller_id)))]);

  return rows.map((row) => {
    const payout = mapSellerPayout(row as Record<string, unknown>);
    const seller = sellers[payout.sellerId];
    return {
      id: payout.id,
      sellerId: payout.sellerId,
      sellerShopName: seller?.shop_name ? String(seller.shop_name) : "Unknown shop",
      sellerCompanyName: seller?.company_name ? String(seller.company_name) : "",
      amount: payout.amount,
      currency: payout.currency,
      status: payout.status,
      requestedAt: payout.requestedAt,
      notes: payout.notes,
    };
  });
}

export async function countPendingSellerDocuments(): Promise<number> {
  const { count, error } = await sellerDb()
    .from("seller_documents")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}

export async function countPendingSellerPayouts(): Promise<number> {
  const { count, error } = await sellerDb()
    .from("seller_payouts")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw error;
  return count ?? 0;
}
