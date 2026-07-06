import { normalizeListingStatus, type SellerListingStatus } from "@/config/seller-listing-status";
import { mapSellerAdminProduct, mapSellerCatalogProduct } from "@/lib/admin/seller-product-mapper";
import { storefrontSectionPatch } from "@/lib/product/deal-flags";
import type { StorefrontSectionFlags } from "@/config/storefront-sections";
import { sellerDb } from "@/lib/seller/db";
import type { SellerAdminCatalogProduct, SellerAdminProduct } from "@/types/seller-admin";
import type { Json } from "@/types/database";

const BASE_SELECT =
  "id, name, slug, base_price, retail_price, markup_percent, stock_quantity, category, listing_status, image_url, metadata, updated_at, created_at";
const CATALOG_SELECT = `${BASE_SELECT}, seller_id, show_in_hot, show_in_steals, show_in_fresh_drops, is_deal, deal_discount_percent`;

async function sellerNameMap(sellerIds: string[]) {
  if (!sellerIds.length) return {};
  const { data } = await sellerDb()
    .from("sellers")
    .select("id, shop_name, company_name")
    .in("id", sellerIds);
  return Object.fromEntries((data ?? []).map((row) => [String(row.id), row]));
}

export async function listSellerProductsForAdmin(sellerId: string): Promise<SellerAdminProduct[]> {
  const { data, error } = await sellerDb()
    .from("products")
    .select(BASE_SELECT)
    .eq("seller_id", sellerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapSellerAdminProduct(row as Record<string, unknown>));
}

export async function listAllSellerProductsForAdmin(): Promise<SellerAdminCatalogProduct[]> {
  const { data, error } = await sellerDb()
    .from("products")
    .select(CATALOG_SELECT)
    .not("seller_id", "is", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  const rows = data ?? [];
  const sellers = await sellerNameMap([...new Set(rows.map((row) => String(row.seller_id)))]);

  return rows.map((row) =>
    mapSellerCatalogProduct(row as Record<string, unknown>, sellers[String(row.seller_id)] ?? null),
  );
}

export async function updateSellerProductStorefront(
  productId: string,
  sections: StorefrontSectionFlags,
): Promise<SellerAdminCatalogProduct> {
  const { data: existing, error: fetchError } = await sellerDb()
    .from("products")
    .select(CATALOG_SELECT)
    .eq("id", productId)
    .not("seller_id", "is", null)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Seller product not found.");

  const patch = storefrontSectionPatch(existing, sections);
  const { data, error } = await sellerDb()
    .from("products")
    .update({
      show_in_hot: patch.show_in_hot,
      show_in_steals: patch.show_in_steals,
      show_in_fresh_drops: patch.show_in_fresh_drops,
      is_deal: patch.is_deal ?? existing.is_deal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select(CATALOG_SELECT)
    .single();

  if (error) throw error;
  const sellers = await sellerNameMap([String(data.seller_id)]);
  return mapSellerCatalogProduct(data as Record<string, unknown>, sellers[String(data.seller_id)] ?? null);
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
    .select(BASE_SELECT)
    .single();

  if (error) throw error;
  return mapSellerAdminProduct(data as Record<string, unknown>);
}

export async function countSellerProducts(sellerId: string): Promise<number> {
  const { count, error } = await sellerDb()
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("seller_id", sellerId);

  if (error) throw error;
  return count ?? 0;
}
