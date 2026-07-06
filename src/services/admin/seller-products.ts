import { normalizeListingStatus, type SellerListingStatus } from "@/config/seller-listing-status";
import { sellerDb } from "@/lib/seller/db";
import type { SellerAdminProduct } from "@/types/seller-admin";
import type { Json } from "@/types/database";

function mapProduct(row: Record<string, unknown>): SellerAdminProduct {
  const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    retailPrice: Number(row.retail_price ?? 0),
    stockQuantity: Number(row.stock_quantity ?? 0),
    category: String(row.category ?? "general"),
    listingStatus: normalizeListingStatus(row.listing_status as string | null),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    moderationNote: metadata.moderationNote ? String(metadata.moderationNote) : undefined,
    updatedAt: String(row.updated_at ?? row.created_at),
  };
}

export async function listSellerProductsForAdmin(sellerId: string): Promise<SellerAdminProduct[]> {
  const { data, error } = await sellerDb()
    .from("products")
    .select("id, name, slug, retail_price, stock_quantity, category, listing_status, image_url, metadata, updated_at, created_at")
    .eq("seller_id", sellerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row as Record<string, unknown>));
}

export async function moderateSellerProduct(input: {
  productId: string;
  sellerId: string;
  listingStatus: SellerListingStatus;
  note?: string;
  staffName: string;
}): Promise<SellerAdminProduct> {
  const db = sellerDb();
  const { data: existing, error: fetchError } = await db
    .from("products")
    .select("id, seller_id, metadata")
    .eq("id", input.productId)
    .eq("seller_id", input.sellerId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Product not found for this seller.");

  const metadata = {
    ...((existing.metadata as Record<string, unknown> | null) ?? {}),
    moderationNote: input.note ?? null,
    moderatedAt: new Date().toISOString(),
    moderatedBy: input.staffName,
  };

  const { data, error } = await db
    .from("products")
    .update({
      listing_status: input.listingStatus,
      metadata: metadata as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.productId)
    .select("id, name, slug, retail_price, stock_quantity, category, listing_status, image_url, metadata, updated_at, created_at")
    .single();

  if (error) throw error;
  return mapProduct(data as Record<string, unknown>);
}

export async function countSellerProducts(sellerId: string): Promise<number> {
  const { count, error } = await sellerDb()
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", sellerId);

  if (error) throw error;
  return count ?? 0;
}
