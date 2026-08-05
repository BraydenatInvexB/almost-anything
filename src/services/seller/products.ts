import { getSellerItemLimit } from "@/config/seller-plans";
import { SA_WAREHOUSE_DELIVERY_DAYS } from "@/config/delivery";
import {
  canSellerChangeListing,
  resolveListingStatusForPublish,
  resolveListingStatusForSave,
  type SellerSaveIntent,
} from "@/lib/seller/listing-status";
import type { SellerListingStatus } from "@/config/seller-listing-status";
import {
  type SellerDeliverySettings,
} from "@/lib/seller/product-pricing";
import { type SellerSupplierInfo } from "@/lib/seller/product-supplier";
import {
  buildSellerProductMetadata,
  resolveSellerDealFields,
  resolveSellerRetailPrice,
  type SellerSpecialPricingInput,
} from "@/lib/seller/product-metadata";
import {
  mapSellerCatalogProduct,
  sellerCatalogProductSelect,
} from "@/lib/seller/catalog-product";
import { normalizeStockImportRow } from "@/lib/seller/stock-import-normalize";
import { parseStockCsv } from "@/lib/seller/stock-import-parser";
import { parseStockOrigin, stockStatusForOrigin } from "@/lib/product/stock-origin";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";
import { sellerDb } from "@/lib/seller/db";
import type { ProductEnrichment } from "@/types/product-enrichment";
import type { ProductVariantsConfig } from "@/types/product-variants";
import type { SellerProfile } from "@/types/seller";
import type { SellerCatalogProduct } from "@/types/seller-catalog";
import type { DeliverySize } from "@/lib/delivery/size";

function slugify(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)}-${Math.random().toString(36).slice(2, 6)}`;
}

export type SellerProductWriteInput = {
  name: string;
  costPrice: number;
  markupPercent: number;
  retailPrice?: number;
  stockQuantity: number;
  category: string;
  imageUrls: string[];
  description?: string;
  deliveryDaysMin?: number;
  deliveryDaysMax?: number;
  deliverySize?: DeliverySize;
  delivery?: SellerDeliverySettings;
  saveIntent?: SellerSaveIntent;
  stockOrigin?: StockOrigin;
  supplier?: SellerSupplierInfo | null;
  variants?: ProductVariantsConfig | null;
  enrichment?: ProductEnrichment | null;
  special?: SellerSpecialPricingInput | null;
};

export async function listSellerProducts(sellerId: string): Promise<SellerCatalogProduct[]> {
  const { data, error } = await sellerDb()
    .from("products")
    .select(sellerCatalogProductSelect())
    .eq("seller_id", sellerId)
    .neq("listing_status", "archived")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapSellerCatalogProduct(row as unknown as Record<string, unknown>));
}

export async function createSellerProduct(
  seller: SellerProfile,
  input: SellerProductWriteInput,
): Promise<SellerCatalogProduct> {
  const limit = getSellerItemLimit(seller.plan);
  if (limit !== null) {
    const existing = await listSellerProducts(seller.id);
    if (existing.length >= limit) {
      throw new Error(`Your ${seller.plan} plan allows up to ${limit} products. Upgrade to add more.`);
    }
  }

  const saveIntent = input.saveIntent ?? "list";
  const costPrice = input.costPrice;
  const markupPercent = input.markupPercent;
  const deal = resolveSellerDealFields(input.special);
  const retailPrice = resolveSellerRetailPrice({
    costPrice,
    markupPercent,
    retailPrice: input.retailPrice,
    special: input.special,
  });
  const listingStatus = resolveListingStatusForSave(seller, saveIntent);
  const slug = slugify(input.name);
  const imageUrl = input.imageUrls[0] ?? null;
  const delivery = input.delivery ?? { customerPaysDelivery: true, deliveryFeeZar: 100 };
  const stockOrigin = parseStockOrigin(input.stockOrigin ?? seller.defaultStockOrigin);
  const metadata = buildSellerProductMetadata({
    imageUrls: input.imageUrls,
    stockOrigin,
    delivery,
    deliverySize: input.deliverySize,
    supplier: input.supplier,
    variants: input.variants,
    enrichment: input.enrichment,
    special: input.special,
  });

  const { data, error } = await sellerDb()
    .from("products")
    .insert({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      category: (input.category || "general") as never,
      base_price: costPrice,
      retail_price: retailPrice,
      markup_percent: markupPercent,
      currency: "ZAR",
      image_url: imageUrl,
      seller_id: seller.id,
      stock_quantity: input.stockQuantity,
      delivery_days_min: input.deliveryDaysMin ?? SA_WAREHOUSE_DELIVERY_DAYS.min,
      delivery_days_max: input.deliveryDaysMax ?? SA_WAREHOUSE_DELIVERY_DAYS.max,
      stock_status: stockStatusForOrigin(stockOrigin, input.stockQuantity),
      listing_status: listingStatus,
      is_deal: deal.isDeal,
      deal_discount_percent: deal.dealDiscountPercent,
      metadata,
    })
    .select(sellerCatalogProductSelect())
    .single();

  if (error) throw error;
  return mapSellerCatalogProduct(data as unknown as Record<string, unknown>);
}

export async function updateSellerProduct(
  seller: SellerProfile,
  productId: string,
  input: SellerProductWriteInput,
): Promise<SellerCatalogProduct> {
  const db = sellerDb();
  const { data: existing, error: fetchError } = await db
    .from("products")
    .select("id, listing_status, metadata")
    .eq("id", productId)
    .eq("seller_id", seller.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Product not found.");

  const currentStatus = (existing.listing_status ?? "draft") as SellerListingStatus;
  if (!canSellerChangeListing(currentStatus) && currentStatus !== "archived") {
    throw new Error("This listing is locked by the marketplace team. Contact support to edit it.");
  }

  const saveIntent = input.saveIntent ?? "draft";
  const costPrice = input.costPrice;
  const markupPercent = input.markupPercent;
  const deal = resolveSellerDealFields(input.special);
  const retailPrice = resolveSellerRetailPrice({
    costPrice,
    markupPercent,
    retailPrice: input.retailPrice,
    special: input.special,
  });
  const listingStatus = resolveListingStatusForSave(seller, saveIntent);
  const delivery = input.delivery ?? { customerPaysDelivery: true, deliveryFeeZar: 100 };
  const stockOrigin = parseStockOrigin(input.stockOrigin ?? seller.defaultStockOrigin);
  const existingMeta =
    existing.metadata && typeof existing.metadata === "object"
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const metadata = buildSellerProductMetadata({
    existingMeta,
    imageUrls: input.imageUrls,
    stockOrigin,
    delivery,
    deliverySize: input.deliverySize,
    supplier: input.supplier,
    variants: input.variants,
    enrichment: input.enrichment,
    special: input.special,
  });

  const { data, error } = await db
    .from("products")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      category: (input.category || "general") as never,
      base_price: costPrice,
      retail_price: retailPrice,
      markup_percent: markupPercent,
      image_url: input.imageUrls[0] ?? null,
      stock_quantity: input.stockQuantity,
      delivery_days_min: input.deliveryDaysMin ?? SA_WAREHOUSE_DELIVERY_DAYS.min,
      delivery_days_max: input.deliveryDaysMax ?? SA_WAREHOUSE_DELIVERY_DAYS.max,
      stock_status: stockStatusForOrigin(stockOrigin, input.stockQuantity),
      listing_status: listingStatus,
      is_deal: deal.isDeal,
      deal_discount_percent: deal.dealDiscountPercent,
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("seller_id", seller.id)
    .select(sellerCatalogProductSelect())
    .single();

  if (error) throw error;
  return mapSellerCatalogProduct(data as unknown as Record<string, unknown>);
}

export async function archiveSellerProduct(
  seller: SellerProfile,
  productId: string,
): Promise<void> {
  const db = sellerDb();
  const { data: existing, error: fetchError } = await db
    .from("products")
    .select("id, listing_status")
    .eq("id", productId)
    .eq("seller_id", seller.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Product not found.");

  const current = (existing.listing_status ?? "draft") as SellerListingStatus;
  if (!canSellerChangeListing(current)) {
    throw new Error("This listing is locked by the marketplace team. Contact support to remove it.");
  }

  const { error } = await db
    .from("products")
    .update({
      listing_status: "archived",
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .eq("seller_id", seller.id);

  if (error) throw error;
}

export async function importSellerStockCsv(
  seller: SellerProfile,
  csv: string,
  fileName: string,
  defaultMarkupPercent = 25,
): Promise<{ successCount: number; draftCount: number; errors: string[] }> {
  const { rows, sourceRowNumbers } = parseStockCsv(csv);
  const errors: string[] = [];
  let successCount = 0;
  let draftCount = 0;

  if (rows.length === 0) {
    throw new Error("No product rows found in this CSV. Add a header row and at least one data row.");
  }

  for (const [index, row] of rows.entries()) {
    const spreadsheetRow = sourceRowNumbers[index] ?? index + 2;
    try {
      const product = normalizeStockImportRow(row, index, {
        defaultMarkupPercent,
        defaultStockOrigin: seller.defaultStockOrigin,
      });

      await createSellerProduct(seller, {
        name: product.name,
        costPrice: product.costPrice,
        markupPercent: product.markupPercent,
        retailPrice: product.retailPrice,
        stockQuantity: product.stockQuantity,
        category: product.category,
        imageUrls: product.imageUrls,
        description: product.description,
        stockOrigin: product.stockOrigin ?? seller.defaultStockOrigin,
        saveIntent: product.saveIntent,
      });
      successCount += 1;
      if (product.incomplete) draftCount += 1;
    } catch (err) {
      errors.push(`Row ${spreadsheetRow}: ${err instanceof Error ? err.message : "Failed"}`);
    }
  }

  const { error: importError } = await sellerDb().from("seller_stock_imports").insert({
    seller_id: seller.id,
    file_name: fileName,
    row_count: rows.length,
    success_count: successCount,
    error_count: errors.length,
    errors,
    status: errors.length && !successCount ? "failed" : "completed",
  });

  if (importError) throw importError;

  return { successCount, draftCount, errors };
}

export async function updateSellerProductStock(
  sellerId: string,
  productId: string,
  stockQuantity: number,
) {
  const { data, error } = await sellerDb()
    .from("products")
    .update({
      stock_quantity: stockQuantity,
      stock_status: stockQuantity > 0 ? "in_stock" : "out_of_stock",
    })
    .eq("id", productId)
    .eq("seller_id", sellerId)
    .select("id, stock_quantity")
    .single();

  if (error) throw error;
  return data;
}

export async function updateSellerProductListing(
  seller: SellerProfile,
  productId: string,
  listingStatus: SellerListingStatus,
) {
  const { data, error } = await sellerDb()
    .from("products")
    .update({ listing_status: listingStatus })
    .eq("id", productId)
    .eq("seller_id", seller.id)
    .select("id, listing_status")
    .single();

  if (error) throw error;
  return data;
}

export async function setSellerProductListingIntent(
  seller: SellerProfile,
  productId: string,
  intent: SellerSaveIntent,
) {
  const { data: existing, error: fetchError } = await sellerDb()
    .from("products")
    .select("listing_status")
    .eq("id", productId)
    .eq("seller_id", seller.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) throw new Error("Product not found.");

  const current = (existing.listing_status ?? "draft") as SellerListingStatus;
  const nextStatus =
    intent === "draft"
      ? "draft"
      : resolveListingStatusForPublish(seller, current);

  return updateSellerProductListing(seller, productId, nextStatus);
}
