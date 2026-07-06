import { sellerDb } from "@/lib/seller/db";

export async function activateSellerSubscriptionOnFirstSale(productIds: string[]): Promise<void> {
  if (productIds.length === 0) return;

  const db = sellerDb();
  const { data: products, error: productsError } = await db
    .from("products")
    .select("seller_id")
    .in("id", productIds)
    .not("seller_id", "is", null);

  if (productsError) throw productsError;

  const sellerIds = [...new Set((products ?? []).map((p) => p.seller_id).filter(Boolean))] as string[];
  if (!sellerIds.length) return;

  const now = new Date().toISOString();
  for (const sellerId of sellerIds) {
    const { data: seller, error: sellerError } = await db
      .from("sellers")
      .select("first_sale_at")
      .eq("id", sellerId)
      .maybeSingle();

    if (sellerError) throw sellerError;
    if (!seller || seller.first_sale_at) continue;

    const { error: updateError } = await db
      .from("sellers")
      .update({
        first_sale_at: now,
        subscription_starts_at: now,
        subscription_status: "active",
      })
      .eq("id", sellerId);

    if (updateError) throw updateError;
  }
}
