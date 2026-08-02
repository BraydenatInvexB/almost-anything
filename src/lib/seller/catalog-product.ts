import { parseProductGallery } from "@/lib/product/product-gallery";
import { parseStockOrigin } from "@/lib/product/stock-origin";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";
import type { SellerCatalogProduct } from "@/types/seller-catalog";

const CATALOG_PRODUCT_SELECT =
  "id, name, slug, description, base_price, retail_price, markup_percent, stock_quantity, category, listing_status, image_url, delivery_days_min, delivery_days_max, metadata";

export function sellerCatalogProductSelect() {
  return CATALOG_PRODUCT_SELECT;
}

export function mapSellerCatalogProduct(row: Record<string, unknown>): SellerCatalogProduct {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description == null ? null : String(row.description),
    base_price: row.base_price as number | string,
    retail_price: row.retail_price as number | string,
    markup_percent: row.markup_percent as number | string,
    stock_quantity: row.stock_quantity as number | string,
    category: row.category == null ? null : String(row.category),
    listing_status: row.listing_status == null ? null : String(row.listing_status),
    image_url: row.image_url == null ? null : String(row.image_url),
    delivery_days_min: row.delivery_days_min as number | string,
    delivery_days_max: row.delivery_days_max as number | string,
    metadata: row.metadata,
  };
}

export function catalogProductImageUrls(product: SellerCatalogProduct): string[] {
  return parseProductGallery(product.metadata, product.image_url);
}

export function catalogProductStockOrigin(
  product: SellerCatalogProduct,
  fallback: StockOrigin,
): StockOrigin {
  const meta =
    product.metadata && typeof product.metadata === "object"
      ? (product.metadata as Record<string, unknown>)
      : null;
  if (meta?.stock_origin != null) return parseStockOrigin(meta.stock_origin);
  return fallback;
}
