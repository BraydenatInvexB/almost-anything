import { normalizeListingStatus } from "@/config/seller-listing-status";
import type { StorefrontSectionFlags } from "@/config/storefront-sections";
import type { SellerAdminCatalogProduct } from "@/types/seller-admin";

export function mapSellerCatalogProduct(
  row: Record<string, unknown>,
  seller?: { shop_name?: string; company_name?: string } | null,
): SellerAdminCatalogProduct {
  const metadata = (row.metadata as Record<string, unknown> | null) ?? {};
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    sellerShopName: seller?.shop_name ? String(seller.shop_name) : "Unknown shop",
    sellerCompanyName: seller?.company_name ? String(seller.company_name) : "",
    name: String(row.name),
    slug: String(row.slug),
    basePrice: Number(row.base_price ?? 0),
    retailPrice: Number(row.retail_price ?? 0),
    markupPercent: Number(row.markup_percent ?? 0),
    stockQuantity: Number(row.stock_quantity ?? 0),
    category: String(row.category ?? "general"),
    listingStatus: normalizeListingStatus(row.listing_status as string | null),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    moderationNote: metadata.moderationNote ? String(metadata.moderationNote) : undefined,
    showInHot: Boolean(row.show_in_hot),
    showInSteals: Boolean(row.show_in_steals),
    showInFreshDrops: Boolean(row.show_in_fresh_drops),
    isDeal: Boolean(row.is_deal),
    dealDiscountPercent:
      row.deal_discount_percent != null ? Number(row.deal_discount_percent) : null,
    updatedAt: String(row.updated_at ?? row.created_at),
  };
}

export function flagsFromSellerProduct(product: SellerAdminCatalogProduct): StorefrontSectionFlags {
  return {
    show_in_hot: product.showInHot,
    show_in_steals: product.showInSteals,
    show_in_fresh_drops: product.showInFreshDrops,
  };
}

export function mapSellerAdminProduct(row: Record<string, unknown>) {
  const product = mapSellerCatalogProduct(row);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    retailPrice: product.retailPrice,
    stockQuantity: product.stockQuantity,
    category: product.category,
    listingStatus: product.listingStatus,
    imageUrl: product.imageUrl,
    moderationNote: product.moderationNote,
    updatedAt: product.updatedAt,
  };
}
