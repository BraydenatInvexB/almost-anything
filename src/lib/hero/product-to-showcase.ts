import type { HeroShowcaseItem } from "@/lib/admin/operations-types";

export type HeroImportProduct = {
  id: string;
  slug: string;
  name: string;
  retail_price: number;
  currency: string;
  image_url: string | null;
  enhanced_image_url?: string | null;
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  stock_status: string;
};

function formatDeliveryDays(min: number | null, max: number | null): string {
  if (min != null && max != null) {
    return min === max ? String(min) : `${min} to ${max}`;
  }
  return "3 to 5";
}

export function heroFieldsFromProduct(product: HeroImportProduct): Partial<HeroShowcaseItem> {
  const inStock = product.stock_status !== "out_of_stock";
  return {
    productSlug: product.slug,
    searchQuery: product.name,
    name: product.name,
    price: Number(product.retail_price),
    currency: product.currency || "ZAR",
    deliveryDays: formatDeliveryDays(product.delivery_days_min, product.delivery_days_max),
    imageUrl: product.enhanced_image_url ?? product.image_url ?? "",
    inStock,
    stockLabel: inStock ? "In stock" : "On order",
  };
}

export function applyProductToHeroItem(
  item: HeroShowcaseItem,
  product: HeroImportProduct,
): HeroShowcaseItem {
  return { ...item, ...heroFieldsFromProduct(product) };
}
