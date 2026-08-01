import { parseImportStockOrigin } from "@/lib/product/stock-origin";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";

/** Canonical columns shown in the UI template. All are optional on upload. */
export const STOCK_IMPORT_COLUMNS = [
  "name",
  "sku",
  "cost_price",
  "markup_percent",
  "price",
  "quantity",
  "warehouse",
  "category",
  "description",
  "image_url",
] as const;

const COLUMN_ALIASES: Record<(typeof STOCK_IMPORT_COLUMNS)[number], string[]> = {
  name: ["name", "product", "product_name", "title", "item", "item_name"],
  sku: ["sku", "code", "product_code", "item_code", "barcode"],
  cost_price: ["cost_price", "cost", "base_price", "wholesale", "wholesale_price"],
  markup_percent: ["markup_percent", "markup", "margin", "margin_percent"],
  price: ["price", "retail_price", "selling_price", "sell_price", "rrp"],
  quantity: ["quantity", "stock", "qty", "inventory", "on_hand", "stock_quantity"],
  warehouse: ["warehouse", "stock_origin", "origin"],
  category: ["category", "cat"],
  description: ["description", "desc", "details"],
  image_url: ["image_url", "image", "img", "photo", "photo_url"],
};

export interface StockImportRow {
  name?: string;
  sku?: string;
  retailPrice?: number;
  costPrice?: number;
  markupPercent?: number;
  quantity?: number;
  category?: string;
  description?: string;
  imageUrl?: string;
  stockOrigin?: StockOrigin;
}

export interface ParsedStockCsv {
  rows: StockImportRow[];
  /** 1-based spreadsheet row numbers aligned with `rows`. */
  sourceRowNumbers: number[];
}

/** Split a CSV line, respecting double-quoted fields. */
export function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[\s/-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function parseNumber(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const cleaned = raw.replace(/[^0-9.+-]/g, "");
  if (!cleaned || cleaned === "+" || cleaned === "-" || cleaned === ".") return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : undefined;
}

function cellAt(cols: string[], index: number | undefined): string | undefined {
  if (index == null || index < 0) return undefined;
  const value = cols[index]?.trim();
  return value || undefined;
}

function buildHeaderIndex(headers: string[]): Partial<Record<(typeof STOCK_IMPORT_COLUMNS)[number], number>> {
  const normalized = headers.map(normalizeHeader);
  const index: Partial<Record<(typeof STOCK_IMPORT_COLUMNS)[number], number>> = {};

  for (const column of STOCK_IMPORT_COLUMNS) {
    const aliases = COLUMN_ALIASES[column];
    const found = normalized.findIndex((header) => aliases.includes(header));
    if (found >= 0) index[column] = found;
  }

  return index;
}

export function isEmptyStockImportRow(row: StockImportRow): boolean {
  return !(
    row.name ||
    row.sku ||
    row.retailPrice != null ||
    row.costPrice != null ||
    row.markupPercent != null ||
    row.quantity != null ||
    row.category ||
    row.description ||
    row.imageUrl ||
    row.stockOrigin
  );
}

/** True when the seller still needs to fill core listing fields later. */
export function isIncompleteStockImportRow(row: StockImportRow): boolean {
  const hasName = Boolean(row.name?.trim() || row.sku?.trim());
  const hasPrice =
    (row.retailPrice != null && row.retailPrice > 0) ||
    (row.costPrice != null && row.costPrice > 0);
  return !hasName || !hasPrice;
}

export function parseStockCsv(text: string): ParsedStockCsv {
  const lines = text.split(/\r?\n/);
  const nonEmpty = lines
    .map((line, index) => ({ line: line.trim(), sourceRow: index + 1 }))
    .filter(({ line }) => line.length > 0);

  if (nonEmpty.length < 2) {
    return { rows: [], sourceRowNumbers: [] };
  }

  const headers = splitCsvLine(nonEmpty[0].line);
  const headerIndex = buildHeaderIndex(headers);

  // Header-less files: treat first row as data if nothing mapped.
  const hasMappedHeaders = Object.keys(headerIndex).length > 0;
  const dataLines = hasMappedHeaders ? nonEmpty.slice(1) : nonEmpty;
  const fallbackNameIndex = hasMappedHeaders ? headerIndex.name : 0;
  const fallbackPriceIndex = hasMappedHeaders ? headerIndex.price : 1;

  const rows: StockImportRow[] = [];
  const sourceRowNumbers: number[] = [];

  for (const { line, sourceRow } of dataLines) {
    const cols = splitCsvLine(line);
    const name = cellAt(cols, headerIndex.name ?? fallbackNameIndex);
    const sku = cellAt(cols, headerIndex.sku);
    const retailPrice = parseNumber(cellAt(cols, headerIndex.price ?? fallbackPriceIndex));
    const costPrice = parseNumber(cellAt(cols, headerIndex.cost_price));
    const markupPercent = parseNumber(cellAt(cols, headerIndex.markup_percent));
    const quantity = parseNumber(cellAt(cols, headerIndex.quantity));
    const warehouseRaw = cellAt(cols, headerIndex.warehouse);
    const row: StockImportRow = {
      name,
      sku,
      retailPrice,
      costPrice: costPrice != null && costPrice > 0 ? costPrice : undefined,
      markupPercent: markupPercent != null && markupPercent > 0 ? markupPercent : undefined,
      quantity: quantity != null && Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : undefined,
      category: cellAt(cols, headerIndex.category),
      description: cellAt(cols, headerIndex.description),
      imageUrl: cellAt(cols, headerIndex.image_url),
      stockOrigin: parseImportStockOrigin(warehouseRaw) ?? undefined,
    };

    if (isEmptyStockImportRow(row)) continue;

    rows.push(row);
    sourceRowNumbers.push(sourceRow);
  }

  return { rows, sourceRowNumbers };
}

export function stockImportTemplate(): string {
  return `${STOCK_IMPORT_COLUMNS.join(",")}\nSample Product,SKU-001,200,25,250,25,sa_warehouse,electronics,Short description,https://example.com/image.jpg\n`;
}
