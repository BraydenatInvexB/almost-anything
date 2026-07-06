import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { listCustomProducts } from "@/lib/admin/operations-store";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import type { HeroImportProduct } from "@/lib/hero/product-to-showcase";

function mapCustom(p: ReturnType<typeof listCustomProducts>[number]): HeroImportProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    retail_price: p.retail_price,
    currency: p.currency,
    image_url: p.image_url,
    enhanced_image_url: p.image_url,
    delivery_days_min: p.delivery_days_min,
    delivery_days_max: p.delivery_days_max,
    stock_status: p.stock_status,
  };
}

export async function GET(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(Number(searchParams.get("limit") ?? 8), 20);

  if (q.length < 1) {
    return NextResponse.json({ products: [] as HeroImportProduct[] });
  }

  const needle = q.toLowerCase();
  const products: HeroImportProduct[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServiceClient();
      const slugTerm = q.replace(/\s+/g, "-");
      const { data } = await supabase
        .from("products")
        .select(
          "id, slug, name, retail_price, currency, image_url, enhanced_image_url, delivery_days_min, delivery_days_max, stock_status",
        )
        .or(`name.ilike.%${q}%,slug.ilike.%${slugTerm}%`)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (data) products.push(...(data as HeroImportProduct[]));
    } catch {
      /* fall through to custom products */
    }
  }

  if (products.length < limit) {
    const custom = listCustomProducts()
      .filter((p) => p.name.toLowerCase().includes(needle) || p.slug.toLowerCase().includes(needle))
      .slice(0, limit - products.length)
      .map(mapCustom);
    products.push(...custom);
  }

  return NextResponse.json({ products: products.slice(0, limit) });
}
