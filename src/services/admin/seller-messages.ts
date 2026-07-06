import { sellerDb } from "@/lib/seller/db";
import type { SellerMessage, SellerMessagePriority } from "@/types/seller-admin";

function mapMessage(row: Record<string, unknown>): SellerMessage {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    senderType: row.sender_type === "seller" ? "seller" : "admin",
    senderName: String(row.sender_name),
    subject: String(row.subject),
    body: String(row.body),
    priority: (row.priority as SellerMessagePriority) ?? "normal",
    readAt: row.read_at ? String(row.read_at) : undefined,
    createdAt: String(row.created_at),
  };
}

export async function listSellerMessages(sellerId: string): Promise<SellerMessage[]> {
  const { data, error } = await sellerDb()
    .from("seller_messages")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
}

export async function sendAdminMessageToSeller(input: {
  sellerId: string;
  staffName: string;
  subject: string;
  body: string;
  priority?: SellerMessagePriority;
}): Promise<SellerMessage> {
  const { data, error } = await sellerDb()
    .from("seller_messages")
    .insert({
      seller_id: input.sellerId,
      sender_type: "admin",
      sender_name: input.staffName,
      subject: input.subject.trim(),
      body: input.body.trim(),
      priority: input.priority ?? "normal",
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapMessage(data as Record<string, unknown>);
}

export async function listUnreadSellerMessages(sellerId: string): Promise<SellerMessage[]> {
  const { data, error } = await sellerDb()
    .from("seller_messages")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("sender_type", "admin")
    .is("read_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
}

export async function markSellerMessagesRead(sellerId: string, messageIds?: string[]): Promise<void> {
  let query = sellerDb()
    .from("seller_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("seller_id", sellerId)
    .eq("sender_type", "admin")
    .is("read_at", null);

  if (messageIds?.length) {
    query = query.in("id", messageIds);
  }

  const { error } = await query;
  if (error) throw error;
}

export async function countUnreadAdminMessages(sellerId: string): Promise<number> {
  const { count, error } = await sellerDb()
    .from("seller_messages")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", sellerId)
    .eq("sender_type", "admin")
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}
