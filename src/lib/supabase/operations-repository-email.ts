import type { EmailBroadcast, EmailSubscriber } from "@/lib/admin/operations-types";
import {
  mapEmailBroadcastRow,
  mapEmailSubscriberRow,
} from "@/lib/supabase/operations-mappers";
import { asRow, asRows, tbl } from "@/lib/supabase/operations-repository-shared";

export async function listEmailSubscribers(): Promise<EmailSubscriber[]> {
  const { data, error } = await tbl("email_marketing_subscribers")
    .select("*")
    .order("subscribed_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapEmailSubscriberRow(r));
}

export async function addEmailSubscriber(
  input: Omit<EmailSubscriber, "id" | "subscribedAt"> & { id?: string },
): Promise<EmailSubscriber> {
  const email = input.email.toLowerCase();
  const { data: existing } = await tbl("email_marketing_subscribers")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    const row = asRow(existing);
    if (row.status === "unsubscribed") {
      const { data: updated } = await tbl("email_marketing_subscribers")
        .update({ status: "active", subscribed_at: new Date().toISOString() })
        .eq("id", String(row.id))
        .select()
        .single();
      return mapEmailSubscriberRow(asRow(updated));
    }
    return mapEmailSubscriberRow(row);
  }

  const { data, error } = await tbl("email_marketing_subscribers")
    .insert({
      id: input.id,
      email,
      name: input.name ?? null,
      source: input.source,
      status: input.status ?? "active",
      tags: input.tags ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return mapEmailSubscriberRow(asRow(data));
}

export async function removeEmailSubscriber(id: string): Promise<boolean> {
  const { error } = await tbl("email_marketing_subscribers").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function updateEmailSubscriber(
  id: string,
  patch: Partial<EmailSubscriber>,
): Promise<EmailSubscriber | null> {
  const update: Record<string, unknown> = {};
  if (patch.email !== undefined) update.email = patch.email.toLowerCase();
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.source !== undefined) update.source = patch.source;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.tags !== undefined) update.tags = patch.tags;

  const { data, error } = await tbl("email_marketing_subscribers")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapEmailSubscriberRow(asRow(data)) : null;
}

export async function listEmailBroadcasts(): Promise<EmailBroadcast[]> {
  const { data, error } = await tbl("email_broadcasts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapEmailBroadcastRow(r));
}

export async function createEmailBroadcast(
  input: Omit<EmailBroadcast, "id" | "createdAt" | "recipientCount" | "status"> & {
    status?: EmailBroadcast["status"];
    recipientCount?: number;
  },
): Promise<EmailBroadcast> {
  const { data, error } = await tbl("email_broadcasts")
    .insert({
      subject: input.subject,
      preview_text: input.previewText ?? null,
      body: input.body,
      audience: input.audience,
      status: input.status ?? "draft",
      recipient_count: input.recipientCount ?? 0,
      sent_at: input.sentAt ?? null,
      scheduled_at: input.scheduledAt ?? null,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return mapEmailBroadcastRow(asRow(data));
}

export async function updateEmailBroadcast(
  id: string,
  patch: Partial<EmailBroadcast>,
): Promise<EmailBroadcast | null> {
  const update: Record<string, unknown> = {};
  if (patch.subject !== undefined) update.subject = patch.subject;
  if (patch.previewText !== undefined) update.preview_text = patch.previewText;
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.audience !== undefined) update.audience = patch.audience;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.recipientCount !== undefined) update.recipient_count = patch.recipientCount;
  if (patch.sentAt !== undefined) update.sent_at = patch.sentAt;
  if (patch.scheduledAt !== undefined) update.scheduled_at = patch.scheduledAt;

  const { data, error } = await tbl("email_broadcasts")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapEmailBroadcastRow(asRow(data)) : null;
}
