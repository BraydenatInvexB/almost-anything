import { getSellerItemLimit } from "@/config/seller-plans";
import { parseStockCsv } from "@/lib/seller/stock-import-parser";
import { sellerDb } from "@/lib/seller/db";
import type { SellerProfile } from "@/types/seller";

function slugify(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50)}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function listSellerProducts(sellerId: string) {
  const { data, error } = await sellerDb()
    .from("products")
    .select("id, name, slug, retail_price, stock_quantity, category, listing_status, image_url, metadata")
    .eq("seller_id", sellerId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createSellerProduct(
  seller: SellerProfile,
  input: {
    name: string;
    retailPrice: number;
    stockQuantity: number;
    category: string;
    imageUrls: string[];
    description?: string;
  },
) {
  const limit = getSellerItemLimit(seller.plan);
  if (limit !== null) {
    const existing = await listSellerProducts(seller.id);
    if (existing.length >= limit) {
      throw new Error(`Your ${seller.plan} plan allows up to ${limit} products. Upgrade to add more.`);
    }
  }

  const slug = slugify(input.name);
  const imageUrl = input.imageUrls[0] ?? null;
  const metadata = {
    gallery: input.imageUrls,
    sellerListing: true,
  };

  const { data, error } = await sellerDb()
    .from("products")
    .insert({
      slug,
      name: input.name.trim(),
      description: input.description?.trim() ?? null,
      category: (input.category || "general") as never,
      base_price: input.retailPrice,
      retail_price: input.retailPrice,
      markup_percent: 0,
      currency: "ZAR",
      image_url: imageUrl,
      seller_id: seller.id,
      stock_quantity: input.stockQuantity,
      listing_status: seller.status === "approved" ? "published" : "pending_review",
      metadata,
    })
    .select("id, slug, name")
    .single();

  if (error) throw error;
  return data;
}

export async function importSellerStockCsv(
  seller: SellerProfile,
  csv: string,
  fileName: string,
): Promise<{ successCount: number; errors: string[] }> {
  const rows = parseStockCsv(csv);
  const errors: string[] = [];
  let successCount = 0;

  for (const [index, row] of rows.entries()) {
    try {
      if (!row.name || row.price <= 0) {
        throw new Error("Name and price are required");
      }
      await createSellerProduct(seller, {
        name: row.name,
        retailPrice: row.price,
        stockQuantity: row.quantity,
        category: row.category ?? "general",
        imageUrls: row.imageUrl ? [row.imageUrl] : [],
        description: row.description,
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
