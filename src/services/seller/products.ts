import { getSellerItemLimit } from "@/config/seller-plans";
import { SA_WAREHOUSE_DELIVERY_DAYS } from "@/config/delivery";
import {
  resolveListingStatusForPublish,
  resolveListingStatusForSave,
  type SellerSaveIntent,
} from "@/lib/seller/listing-status";
import type { SellerListingStatus } from "@/config/seller-listing-status";
import {
  markupFromPrices,
  retailFromCost,
  sellerDeliveryMetadata,
  type SellerDeliverySettings,
} from "@/lib/seller/product-pricing";
import { parseStockCsv } from "@/lib/seller/stock-import-parser";
import { sellerDb } from "@/lib/seller/db";
import type { SellerProfile } from "@/types/seller";

function slugify(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function listSellerProducts(sellerId: string) {
  const { data, error } = await sellerDb()
    .from("products")
    .select(
      "id, name, slug, base_price, retail_price, markup_percent, stock_quantity, category, listing_status, image_url, delivery_days_min, delivery_days_max, metadata",
    )
    .eq("seller_id", sellerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createSellerProduct(
  seller: SellerProfile,
  input: {
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
    delivery?: SellerDeliverySettings;
    saveIntent?: SellerSaveIntent;
  },
) {
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
  const retailPrice =
    input.retailPrice ??
    (costPrice > 0 ? retailFromCost(costPrice, markupPercent) : 0);
  const listingStatus = resolveListingStatusForSave(seller, saveIntent);
  const slug = slugify(input.name);
  const imageUrl = input.imageUrls[0] ?? null;
  const delivery = input.delivery ?? { customerPaysDelivery: true, deliveryFeeZar: null };
  const metadata = {
    gallery: input.imageUrls,
    sellerListing: true,
    ...sellerDeliveryMetadata(delivery),
  };

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
      stock_status: input.stockQuantity > 0 ? "in_stock" : "out_of_stock",
      listing_status: listingStatus,
      metadata,
    })
    .select("id, slug, name, base_price, retail_price, markup_percent, listing_status")
    .single();

  if (error) throw error;
  return data;
}

export async function importSellerStockCsv(
  seller: SellerProfile,
  csv: string,
  fileName: string,
  defaultMarkupPercent = 25,
): Promise<{ successCount: number; errors: string[] }> {
  const rows = parseStockCsv(csv);
  const errors: string[] = [];
  let successCount = 0;

  for (const [index, row] of rows.entries()) {
    try {
      if (!row.name || row.retailPrice <= 0) {
        throw new Error("Name and price are required");
      }
      const costPrice = row.costPrice ?? row.retailPrice / (1 + (row.markupPercent ?? defaultMarkupPercent) / 100);
      const markupPercent = row.markupPercent ?? markupFromPrices(costPrice, row.retailPrice);

      await createSellerProduct(seller, {
        name: row.name,
        costPrice: Number(costPrice.toFixed(2)),
        markupPercent,
        retailPrice: row.retailPrice,
        stockQuantity: row.quantity,
        category: row.category ?? "general",
        imageUrls: row.imageUrl ? [row.imageUrl] : [],
        description: row.description,
        saveIntent: "list",
      });
      successCount += 1;
    } catch (err) {
      errors.push(`Row ${index + 2}: ${err instanceof Error ? err.message : "Failed"}`);
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

  return { successCount, errors };
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
