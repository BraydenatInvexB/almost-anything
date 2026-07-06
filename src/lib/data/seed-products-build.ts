import type { Product } from "@/types";
import type { Json, ProductCategory } from "@/types/database";
import type { ProductVariantsConfig } from "@/types/product-variants";

type StockStatus = Product["stock_status"];

interface SeedInput {
  slug: string;
  name: string;
  category: ProductCategory;
  base: number;
  desc: string;
  img: string;
  rating?: number;
  reviews?: number;
  markup?: number;
  stock?: StockStatus;
  supplier?: string;
  featured?: boolean;
  exclusive?: boolean;
  deal?: number;
  hot?: boolean;
  steals?: boolean;
  fresh?: boolean;
  dmin?: number;
  dmax?: number;
  badge?: string;
  variants?: ProductVariantsConfig;
}

export type SeedProduct = Omit<Product, "id" | "created_at" | "updated_at">;

const round2 = (n: number) => Math.round(n * 100) / 100;
const ZAR_RATE = 18;

function img(path: string, w = 800, h = 800) {
  return `https://images.unsplash.com/${path}?w=${w}&h=${h}&fit=crop`;
}

export function product(p: SeedInput): SeedProduct {
  const markup = p.markup ?? 18;
  const base = round2(p.base * ZAR_RATE);
  const retail = round2(base * (1 + markup / 100));
  const imageUrl = img(p.img);
  return {
    slug: p.slug,
    name: p.name,
    description: p.desc,
    category: p.category,
    base_price: base,
    retail_price: retail,
    markup_percent: markup,
    currency: "ZAR",
    rating: p.rating ?? 4.6,
    review_count: p.reviews ?? Math.floor(40 + Math.random() * 260),
    stock_status: p.stock ?? "in_stock",
    image_url: imageUrl,
    enhanced_image_url: `${imageUrl}&q=90`,
    source_url: `https://example.com/catalog/${p.slug}`,
    source_name: p.supplier ?? "Almost Anything",
    delivery_days_min: p.dmin ?? 2,
    delivery_days_max: p.dmax ?? 7,
    is_featured: p.featured ?? false,
    is_exclusive: p.exclusive ?? false,
    is_deal: p.deal !== undefined,
    deal_discount_percent: p.deal ?? null,
    show_in_hot: p.hot ?? p.featured ?? false,
    show_in_steals: p.steals ?? p.deal !== undefined,
    show_in_fresh_drops: p.fresh ?? p.badge === "New",
    seller_id: null,
    listing_status: "published",
    stock_quantity: 0,
    metadata: {
      ...(p.badge ? { badge: p.badge } : {}),
      ...(p.variants ? { variants: p.variants } : {}),
    } as Json,
  };
}
