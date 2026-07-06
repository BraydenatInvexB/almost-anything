import { listAdminProducts } from "@/services/admin/products";

export async function buildProductCategoryMap(): Promise<Map<string, string>> {
  const products = await listAdminProducts();
  const map = new Map<string, string>();
  for (const product of products) {
    map.set(product.id, product.category);
    map.set(product.slug, product.category);
  }
  return map;
}
