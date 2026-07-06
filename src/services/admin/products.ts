import { createClient } from "@/lib/supabase/server";
import { listCustomProducts } from "@/lib/admin/operations-store";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import type { Product } from "@/types/database";

export async function listAdminProducts(): Promise<Product[]> {
  const custom = listCustomProducts().map(
    (p) =>
      ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category as Product["category"],
        base_price: p.base_price,
        retail_price: p.retail_price,
        markup_percent: p.markup_percent,
        currency: p.currency,
        rating: 0,
        review_count: 0,
        stock_status: p.stock_status,
        image_url: p.image_url,
        enhanced_image_url: p.image_url,
        source_url: null,
        source_name: p.source_name,
        delivery_days_min: p.delivery_days_min,
        delivery_days_max: p.delivery_days_max,
        is_featured: p.is_featured,
        is_exclusive: false,
        is_deal: p.is_deal,
        deal_discount_percent: p.deal_discount_percent,
        show_in_hot: p.show_in_hot ?? false,
        show_in_steals: p.show_in_steals ?? false,
        show_in_fresh_drops: p.show_in_fresh_drops ?? false,
        seller_id: null,
        listing_status: "published",
        stock_quantity: p.quantity ?? 0,
        metadata: { stock_origin: p.stock_origin, quantity: p.quantity },
        created_at: p.created_at,
        updated_at: p.updated_at,
      }) as Product,
  );

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return [...((data ?? []) as Product[]), ...custom];
    } catch {
      /* fall through */
    }
  }
  return [
    ...SEED_PRODUCTS.map((p, i) => ({
      ...p,
      id: `seed-${p.slug}`,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    })) as Product[],
    ...custom,
  ];
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const products = await listAdminProducts();
  return products.find((p) => p.id === id || p.slug === id) ?? null;
}
