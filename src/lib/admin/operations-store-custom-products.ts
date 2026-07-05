import type { AdminProductDraft } from "@/lib/admin/operations-types";
import { state } from "@/lib/admin/operations-store-core";

export function listCustomProducts() {
  return state.customProducts;
}

export function getCustomProduct(id: string) {
  return state.customProducts.find((p) => p.id === id) ?? null;
}

export function createCustomProduct(input: Omit<AdminProductDraft, "id" | "created_at" | "updated_at">) {
  const now = new Date().toISOString();
  const product: AdminProductDraft = {
    ...input,
    id: `custom-${Date.now()}`,
    created_at: now,
    updated_at: now,
  };
  state.customProducts.unshift(product);
  state.inventory.unshift({
    productId: product.id,
    sku: `AA-${product.slug.slice(0, 8).toUpperCase()}`,
    quantity: input.quantity,
    reorderPoint: 5,
    origin: input.stock_origin,
    warehouse: input.stock_origin === "sa_warehouse" ? "Johannesburg DC" : "Overseas pipeline",
    lastCountedAt: now,
  });
  return product;
}

export function updateCustomProduct(id: string, patch: Partial<AdminProductDraft>) {
  const idx = state.customProducts.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const current = state.customProducts[idx];
  const base = patch.base_price ?? current.base_price;
  const markup = patch.markup_percent ?? current.markup_percent;
  const next: AdminProductDraft = {
    ...current,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  if (
    patch.retail_price === undefined &&
    (patch.markup_percent !== undefined || patch.base_price !== undefined)
  ) {
    next.retail_price = Number((base * (1 + Number(markup) / 100)).toFixed(2));
  }
  state.customProducts[idx] = next;
  return state.customProducts[idx];
}
