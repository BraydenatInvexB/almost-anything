import type { ProductCategory } from "@/types/database";
import type { PromoCode } from "@/lib/admin/operations-promo-types";

export function mapPromoCodeRow(row: Record<string, unknown>): PromoCode {
  return {
    id: String(row.id),
    code: String(row.code),
    label: row.label ? String(row.label) : undefined,
    status: row.status as PromoCode["status"],
    discountType: row.discount_type as PromoCode["discountType"],
    discountValue: Number(row.discount_value),
    scope: row.scope as PromoCode["scope"],
    productIds: Array.isArray(row.product_ids) ? (row.product_ids as string[]) : [],
    categorySlugs: Array.isArray(row.category_slugs)
      ? (row.category_slugs as ProductCategory[])
      : [],
    minOrderAmount: row.min_order_amount != null ? Number(row.min_order_amount) : undefined,
    maxDiscountAmount: row.max_discount_amount != null ? Number(row.max_discount_amount) : undefined,
    startsAt: row.starts_at ? String(row.starts_at) : undefined,
    endsAt: row.ends_at ? String(row.ends_at) : undefined,
    usageLimit: row.usage_limit != null ? Number(row.usage_limit) : undefined,
    usageCount: Number(row.usage_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
