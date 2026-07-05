import type { CreateReturnInput } from "@/lib/admin/operations-store";
import type { ReturnRequest } from "@/lib/admin/operations-types";
import { mapReturnRow } from "@/lib/supabase/operations-mappers";
import { asRow, asRows, tbl } from "@/lib/supabase/operations-repository-shared";

export async function listReturns(): Promise<ReturnRequest[]> {
  const { data, error } = await tbl("return_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapReturnRow(r));
}

export async function getReturn(id: string): Promise<ReturnRequest | null> {
  const { data, error } = await tbl("return_requests")
    .select("*")
    .or(`id.eq.${id},rma_number.eq.${id}`)
    .maybeSingle();
  if (error) throw error;
  return data ? mapReturnRow(asRow(data)) : null;
}

export async function listReturnsByOrder(orderId: string): Promise<ReturnRequest[]> {
  const all = await listReturns();
  return all.filter((r) => r.orderId === orderId || r.orderNumber === orderId);
}

export async function listReturnsByEmail(email: string): Promise<ReturnRequest[]> {
  const q = email.trim().toLowerCase();
  const { data, error } = await tbl("return_requests")
    .select("*")
    .ilike("customer_email", q)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapReturnRow(r));
}

export async function createReturn(input: CreateReturnInput): Promise<ReturnRequest> {
  const now = new Date().toISOString();
  const rmaNumber = `RMA-${Math.floor(Math.random() * 90000) + 10000}`;
  const notes = input.notes ?? [];

  const { data, error } = await tbl("return_requests")
    .insert({
      rma_number: rmaNumber,
      order_id: input.orderId.match(/^[0-9a-f-]{36}$/i) ? input.orderId : null,
      order_number: input.orderNumber,
      user_id: input.customerId?.match(/^[0-9a-f-]{36}$/i) ? input.customerId : null,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      reason_code: input.reasonCode,
      reason: input.reason,
      items: input.items,
      method: input.method,
      status: "requested",
      refund_amount: input.refundAmount,
      currency: input.currency,
      restock_items: input.restockItems,
      assigned_to: input.assignedTo ?? null,
      ticket_id: input.ticketId ?? null,
      notes,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return mapReturnRow(asRow(data));
}

export async function updateReturn(
  id: string,
  patch: Partial<ReturnRequest>,
): Promise<ReturnRequest | null> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.refundAmount !== undefined) update.refund_amount = patch.refundAmount;
  if (patch.restockItems !== undefined) update.restock_items = patch.restockItems;
  if (patch.assignedTo !== undefined) update.assigned_to = patch.assignedTo;
  if (patch.rejectionReason !== undefined) update.rejection_reason = patch.rejectionReason;
  if (patch.notes !== undefined) update.notes = patch.notes;
  if (patch.approvedAt !== undefined) update.approved_at = patch.approvedAt;
  if (patch.receivedAt !== undefined) update.received_at = patch.receivedAt;
  if (patch.resolvedAt !== undefined) update.resolved_at = patch.resolvedAt;

  const { data, error } = await tbl("return_requests")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapReturnRow(asRow(data)) : null;
}

export async function addReturnNote(
  returnId: string,
  note: Omit<ReturnRequest["notes"][number], "id" | "createdAt">,
): Promise<ReturnRequest | null> {
  const existing = await getReturn(returnId);
  if (!existing) return null;
  const entry = {
    ...note,
    id: `rn-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  return updateReturn(existing.id, { notes: [...existing.notes, entry] });
}
