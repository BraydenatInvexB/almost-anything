import type { CustomerItemRequest } from "@/lib/admin/operations-types";
import { mapItemRequestRow } from "@/lib/supabase/operations-mappers";
import { asRow, asRows, tbl } from "@/lib/supabase/operations-repository-shared";

export async function listItemRequests(): Promise<CustomerItemRequest[]> {
  const { data, error } = await tbl("customer_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapItemRequestRow(r));
}

export async function getItemRequest(id: string): Promise<CustomerItemRequest | null> {
  const { data, error } = await tbl("customer_requests")
    .select("*")
    .or(`id.eq.${id},request_number.ilike.${id}`)
    .maybeSingle();
  if (error) throw error;
  return data ? mapItemRequestRow(asRow(data)) : null;
}

export async function createItemRequest(input: {
  id?: string;
  query: string;
  customerEmail?: string;
  budget?: number;
  currency?: string;
  urgency?: CustomerItemRequest["urgency"];
  userId?: string;
}): Promise<CustomerItemRequest> {
  const now = new Date().toISOString();
  const requestNumber = `REQ-${Math.floor(Math.random() * 90000) + 10000}`;
  const id = input.id ?? `req-${Date.now()}`;

  const { data, error } = await tbl("customer_requests")
    .insert({
      id,
      user_id: input.userId ?? null,
      query: input.query.trim(),
      request_number: requestNumber,
      customer_email: input.customerEmail?.trim().toLowerCase() ?? null,
      budget: input.budget ?? null,
      currency: input.currency ?? "ZAR",
      urgency: input.urgency ?? "standard",
      status: "searching",
      parsed_intent: {
        query: input.query,
        budget: input.budget ?? null,
        email: input.customerEmail ?? null,
        urgency: input.urgency ?? "standard",
      },
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return mapItemRequestRow(asRow(data));
}

export async function updateItemRequest(
  id: string,
  patch: Partial<CustomerItemRequest>,
): Promise<CustomerItemRequest | null> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.assignedTo !== undefined) update.assigned_to = patch.assignedTo;
  if (patch.internalNotes !== undefined) update.internal_notes = patch.internalNotes;
  if (patch.quotedAmount !== undefined) update.quoted_amount = patch.quotedAmount;
  if (patch.budget !== undefined) update.budget = patch.budget;
  if (patch.urgency !== undefined) update.urgency = patch.urgency;
  if (patch.customerEmail !== undefined) update.customer_email = patch.customerEmail;

  const { data, error } = await tbl("customer_requests")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapItemRequestRow(asRow(data)) : null;
}
