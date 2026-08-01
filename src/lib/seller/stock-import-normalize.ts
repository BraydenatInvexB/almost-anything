import {
  markupFromPrices,
  retailFromCost,
  SELLER_DEFAULT_MARKUP_PERCENT,
} from "@/lib/seller/product-pricing";
import {
  isIncompleteStockImportRow,
  type StockImportRow,
} from "@/lib/seller/stock-import-parser";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";
import type { SellerSaveIntent } from "@/lib/seller/listing-status";

export type NormalizedStockImportProduct = {
  name: string;
  costPrice: number;
  markupPercent: number;
  retailPrice: number;
  stockQuantity: number;
  category: string;
  imageUrls: string[];
  description?: string;
  stockOrigin?: StockOrigin;
  saveIntent: SellerSaveIntent;
  incomplete: boolean;
};

function resolveDisplayName(row: StockImportRow, rowIndex: number): string {
  const name = row.name?.trim();
  if (name) return name;
  if (row.sku?.trim()) return `Product ${row.sku.trim()}`;
  return `Imported product ${rowIndex + 1}`;
}

function resolvePricing(row: StockImportRow, defaultMarkupPercent: number) {
  const markup =
    row.markupPercent != null && row.markupPercent > 0
      ? row.markupPercent
      : defaultMarkupPercent;

  if (row.retailPrice != null && row.retailPrice > 0) {
    const retailPrice = Number(row.retailPrice.toFixed(2));
    const costPrice =
      row.costPrice != null && row.costPrice > 0
        ? Number(row.costPrice.toFixed(2))
        : Number((retailPrice / (1 + markup / 100)).toFixed(2));
    const markupPercent =
      row.markupPercent != null && row.markupPercent > 0
        ? row.markupPercent
        : markupFromPrices(costPrice, retailPrice);
    return { costPrice, markupPercent, retailPrice };
  }

  if (row.costPrice != null && row.costPrice > 0) {
    const costPrice = Number(row.costPrice.toFixed(2));
    const retailPrice = retailFromCost(costPrice, markup);
    return { costPrice, markupPercent: markup, retailPrice };
  }

  return {
    costPrice: 0,
    markupPercent: markup,
    retailPrice: 0,
  };
}

/**
 * Maps a parsed CSV row into a product create payload.
 * Missing fields get safe defaults; incomplete rows are saved as drafts.
 */
export function normalizeStockImportRow(
  row: StockImportRow,
  rowIndex: number,
  options: {
    defaultMarkupPercent?: number;
    defaultStockOrigin?: StockOrigin;
  } = {},
): NormalizedStockImportProduct {
  const defaultMarkup = options.defaultMarkupPercent ?? SELLER_DEFAULT_MARKUP_PERCENT;
  const incomplete = isIncompleteStockImportRow(row);
  const pricing = resolvePricing(row, defaultMarkup);

  return {
    name: resolveDisplayName(row, rowIndex),
    ...pricing,
    stockQuantity: row.quantity ?? 0,
    category: row.category?.trim() || "general",
    imageUrls: row.imageUrl ? [row.imageUrl] : [],
    description: row.description?.trim() || undefined,
    stockOrigin: row.stockOrigin ?? options.defaultStockOrigin,
    // Incomplete listings stay private until the seller fills price/name.
    saveIntent: incomplete ? "draft" : "list",
    incomplete,
  };
}
