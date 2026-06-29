import type { CheckoutOrderLineItem } from "@/lib/admin/operations-types";

export type OrderLineItemView = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  sku?: string;
  variantId?: string;
  variantLabel?: string;
  selectedOptions?: Record<string, string>;
  productId?: string;
};

export function parseOrderItemMetadata(meta: Record<string, unknown> | null | undefined) {
  const m = meta ?? {};
  const selectedOptions =
    m.selectedOptions && typeof m.selectedOptions === "object"
      ? (m.selectedOptions as Record<string, string>)
      : undefined;
  return {
    variantId: typeof m.variantId === "string" ? m.variantId : undefined,
    variantLabel: typeof m.variantLabel === "string" ? m.variantLabel : undefined,
    sku: typeof m.sku === "string" ? m.sku : undefined,
    productId: typeof m.productId === "string" ? m.productId : undefined,
    selectedOptions,
    supplierName: typeof m.supplierName === "string" ? m.supplierName : undefined,
  };
}

export function cartItemToLineItem(item: {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  productId?: string;
  variantId?: string;
  variantLabel?: string;
  selectedOptions?: Record<string, string>;
  slug?: string;
}): CheckoutOrderLineItem {
  return {
    id: item.id,
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    imageUrl: item.imageUrl,
    variantId: item.variantId,
    variantLabel: item.variantLabel,
    selectedOptions: item.selectedOptions,
    sku: item.slug ? `AA-${item.slug.slice(0, 12).toUpperCase()}` : undefined,
  };
}

export function toAdminLineItem(item: CheckoutOrderLineItem): OrderLineItemView {
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    imageUrl: item.imageUrl,
    sku: item.sku,
    variantId: item.variantId,
    variantLabel: item.variantLabel,
    selectedOptions: item.selectedOptions,
    productId: item.productId,
  };
}

export function formatLineItemOptions(item: OrderLineItemView): string[] {
  const lines: string[] = [];
  if (item.variantLabel) lines.push(item.variantLabel);
  if (item.selectedOptions) {
    for (const [key, value] of Object.entries(item.selectedOptions)) {
      lines.push(`${key}: ${value}`);
    }
  }
  return lines;
}
