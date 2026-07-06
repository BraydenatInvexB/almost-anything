import type { PromoCode, PromoCodeInput } from "@/lib/admin/operations-promo-types";
import { mapPromoCodeRow } from "@/lib/supabase/operations-mappers-promo";
import { normalizePromoCodeValue } from "@/lib/admin/operations-store-promos";
import { asRow, asRows, tbl } from "@/lib/supabase/operations-repository-shared";

function toInsert(input: PromoCodeInput) {
  return {
    code: normalizePromoCodeValue(input.code),
    label: input.label ?? null,
    status: input.status,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    scope: input.scope,
    product_ids: input.productIds,
    category_slugs: input.categorySlugs,
    min_order_amount: input.minOrderAmount ?? null,
    max_discount_amount: input.maxDiscountAmount ?? null,
    starts_at: input.startsAt ?? null,
    ends_at: input.endsAt ?? null,
    usage_limit: input.usageLimit ?? null,
  };
}

export async function listPromoCodes(): Promise<PromoCode[]> {
  const { data, error } = await tbl("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return asRows(data).map((row) => mapPromoCodeRow(row));
}

export async function getPromoByCode(code: string): Promise<PromoCode | null> {
  const normalized = normalizePromoCodeValue(code);
  const { data, error } = await tbl("promo_codes")
    .select("*")
    .eq("code", normalized)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPromoCodeRow(asRow(data)) : null;
}

export async function createPromoCode(input: PromoCodeInput): Promise<PromoCode> {
  const { data, error } = await tbl("promo_codes").insert(toInsert(input)).select().single();
  if (error) throw error;
  return mapPromoCodeRow(asRow(data));
}

export async function updatePromoCode(
  id: string,
  patch: Partial<PromoCodeInput>,
): Promise<PromoCode | null> {
  const update: Record<string, unknown> = {};
  if (patch.code !== undefined) update.code = normalizePromoCodeValue(patch.code);
  if (patch.label !== undefined) update.label = patch.label ?? null;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.discountType !== undefined) update.discount_type = patch.discountType;
  if (patch.discountValue !== undefined) update.discount_value = patch.discountValue;
  if (patch.scope !== undefined) update.scope = patch.scope;
  if (patch.productIds !== undefined) update.product_ids = patch.productIds;
  if (patch.categorySlugs !== undefined) update.category_slugs = patch.categorySlugs;
  if (patch.minOrderAmount !== undefined) update.min_order_amount = patch.minOrderAmount ?? null;
  if (patch.maxDiscountAmount !== undefined) update.max_discount_amount = patch.maxDiscountAmount ?? null;
  if (patch.startsAt !== undefined) update.starts_at = patch.startsAt ?? null;
  if (patch.endsAt !== undefined) update.ends_at = patch.endsAt ?? null;
  if (patch.usageLimit !== undefined) update.usage_limit = patch.usageLimit ?? null;

  const { data, error } = await tbl("promo_codes")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapPromoCodeRow(asRow(data)) : null;
}

export async function deletePromoCode(id: string): Promise<void> {
  const { error } = await tbl("promo_codes").delete().eq("id", id);
  if (error) throw error;
}

export async function incrementPromoUsage(id: string): Promise<PromoCode | null> {
  const { data: current, error: readError } = await tbl("promo_codes")
    .select("usage_count")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw readError;
  if (!current) return null;

  const usageCount = Number(asRow(current).usage_count ?? 0) + 1;
  const { data, error } = await tbl("promo_codes")
    .update({ usage_count: usageCount })
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? mapPromoCodeRow(asRow(data)) : null;
}
