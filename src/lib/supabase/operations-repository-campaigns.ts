import type { Campaign } from "@/lib/admin/operations-types";
import { mapCampaignRow } from "@/lib/supabase/operations-mappers";
import { asRow, asRows, tbl } from "@/lib/supabase/operations-repository-shared";

export async function listCampaigns(): Promise<Campaign[]> {
  const { data, error } = await tbl("marketing_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((r) => mapCampaignRow(r));
}

export async function createCampaign(
  input: Omit<Campaign, "id" | "reach" | "clicks" | "createdAt">,
): Promise<Campaign> {
  const { data, error } = await tbl("marketing_campaigns")
    .insert({
      name: input.name,
      channel: input.channel,
      status: input.status,
      promo_code: input.promoCode ?? null,
      discount_percent: input.discountPercent ?? null,
      audience: input.audience,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCampaignRow(asRow(data));
}

export async function updateCampaign(
  id: string,
  patch: Partial<Campaign>,
): Promise<Campaign | null> {
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.channel !== undefined) update.channel = patch.channel;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.promoCode !== undefined) update.promo_code = patch.promoCode;
  if (patch.discountPercent !== undefined) update.discount_percent = patch.discountPercent;
  if (patch.audience !== undefined) update.audience = patch.audience;
  if (patch.startsAt !== undefined) update.starts_at = patch.startsAt;
  if (patch.endsAt !== undefined) update.ends_at = patch.endsAt;
  if (patch.reach !== undefined) update.reach = patch.reach;
  if (patch.clicks !== undefined) update.clicks = patch.clicks;

  const { data, error } = await tbl("marketing_campaigns")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapCampaignRow(asRow(data)) : null;
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await tbl("marketing_campaigns").delete().eq("id", id);
  if (error) throw error;
}
