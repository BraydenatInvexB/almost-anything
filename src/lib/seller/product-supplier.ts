export type SellerSupplierInfo = {
  /** When false/omitted, supplier fields are not tracked for this product. */
  tracked: boolean;
  name?: string;
  contact?: string;
  sku?: string;
  url?: string;
  notes?: string;
};

const EMPTY_SUPPLIER: SellerSupplierInfo = { tracked: false };

function trimOrUndefined(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Read optional private supplier tracking from product metadata. */
export function parseSellerSupplier(metadata: unknown): SellerSupplierInfo {
  if (!metadata || typeof metadata !== "object") return { ...EMPTY_SUPPLIER };
  const raw = (metadata as Record<string, unknown>).seller_supplier;
  if (!raw || typeof raw !== "object") return { ...EMPTY_SUPPLIER };

  const obj = raw as Record<string, unknown>;
  const name = trimOrUndefined(obj.name);
  const contact = trimOrUndefined(obj.contact);
  const sku = trimOrUndefined(obj.sku);
  const url = trimOrUndefined(obj.url);
  const notes = trimOrUndefined(obj.notes);
  const hasAny = Boolean(name || contact || sku || url || notes);
  const tracked = obj.tracked === true || (obj.tracked !== false && hasAny);

  if (!tracked) return { tracked: false };

  return { tracked: true, name, contact, sku, url, notes };
}

export function hasSellerSupplier(info: SellerSupplierInfo): boolean {
  return Boolean(
    info.tracked && (info.name || info.contact || info.sku || info.url || info.notes),
  );
}

/** Normalize supplier payload before persisting to metadata. */
export function normalizeSellerSupplier(input?: SellerSupplierInfo | null): SellerSupplierInfo {
  if (!input?.tracked) return { tracked: false };
  return {
    tracked: true,
    name: trimOrUndefined(input.name),
    contact: trimOrUndefined(input.contact),
    sku: trimOrUndefined(input.sku),
    url: trimOrUndefined(input.url),
    notes: trimOrUndefined(input.notes),
  };
}

/** Merge into product metadata. Removes the key when tracking is off. */
export function applySellerSupplierMetadata(
  metadata: Record<string, unknown>,
  input?: SellerSupplierInfo | null,
): Record<string, unknown> {
  const next = { ...metadata };
  const supplier = normalizeSellerSupplier(input);

  if (!supplier.tracked) {
    delete next.seller_supplier;
    return next;
  }

  next.seller_supplier = {
    tracked: true,
    name: supplier.name ?? null,
    contact: supplier.contact ?? null,
    sku: supplier.sku ?? null,
    url: supplier.url ?? null,
    notes: supplier.notes ?? null,
  };
  return next;
}
