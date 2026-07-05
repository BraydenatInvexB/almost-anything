import type { Product, ProductCardData } from "@/types";
import type { ProductCategory } from "@/types/database";
import type { StorefrontSectionId } from "@/config/storefront-sections";
import { STOREFRONT_SECTION_BY_ID } from "@/config/storefront-sections";
import type { SeedProduct } from "@/lib/data/seed-products-build";
import { SEED_PRODUCTS } from "@/lib/data/seed-products-data";

export function mapProductToCard(item: Product): ProductCardData {
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description ?? undefined,
    price: item.retail_price,
    currency: item.currency,
    rating: item.rating,
    imageUrl: item.enhanced_image_url ?? item.image_url ?? "",
    category: item.category,
    isDeal: item.is_deal,
    dealLabel: item.deal_discount_percent
      ? `${item.deal_discount_percent}% off`
      : undefined,
    dealDiscountPercent: item.deal_discount_percent ?? undefined,
    isExclusive: item.is_exclusive,
  };
}

function withIds(items: SeedProduct[]): Product[] {
  return items.map((p, index) => ({
    ...p,
    id: `seed-${index}`,
    created_at: new Date(Date.now() - index * 3600_000).toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

const SEEDED: Product[] = withIds(SEED_PRODUCTS);

export function getProductBySlugSeed(slug: string): Product | undefined {
  return SEEDED.find((p) => p.slug === slug);
}

export function getFeaturedProduct(): ProductCardData {
  const featured = SEEDED.find((p) => p.slug === "long-chair-curved") ?? SEEDED[0];
  return mapProductToCard(featured);
}

export function getDealProduct(): ProductCardData {
  const deal =
    SEEDED.find((p) => p.slug === "minimal-oak-armchair") ??
    SEEDED.find((p) => p.is_deal) ??
    SEEDED[0];
  return mapProductToCard(deal);
}

export function getExclusiveProduct(): ProductCardData {
  const exclusive =
    SEEDED.find((p) => p.slug === "purespace-focus-duo") ??
    SEEDED.find((p) => p.is_exclusive) ??
    SEEDED[0];
  return mapProductToCard(exclusive);
}

export type SortKey = "featured" | "newest" | "price_asc" | "price_desc" | "rating";

function sortProducts(items: Product[], sort?: SortKey): Product[] {
  const copy = [...items];
  switch (sort) {
    case "price_asc":
      return copy.sort((a, b) => a.retail_price - b.retail_price);
    case "price_desc":
      return copy.sort((a, b) => b.retail_price - a.retail_price);
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "newest":
      return copy.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "featured":
    default:
      return copy.sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured) || b.rating - a.rating,
      );
  }
}

export interface SeedFilterOptions {
  category?: ProductCategory | string;
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: SortKey;
  featuredOnly?: boolean;
  dealsOnly?: boolean;
  section?: StorefrontSectionId;
}

function applyFilters(options: SeedFilterOptions): Product[] {
  const { category, query, featuredOnly, dealsOnly, section } = options;
  let results = SEEDED;

  if (category && category !== "all") {
    results = results.filter((p) => p.category === category);
  }
  if (featuredOnly) results = results.filter((p) => p.is_featured);
  if (dealsOnly) results = results.filter((p) => p.is_deal);
  if (section) {
    const col = STOREFRONT_SECTION_BY_ID[section].column;
    results = results.filter((p) => Boolean(p[col]));
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.includes(q),
    );
  }

  return sortProducts(results, options.sort);
}

export function filterSeedProducts(options: SeedFilterOptions): Product[] {
  const { page = 1, pageSize = 12 } = options;
  const results = applyFilters(options);
  const start = (page - 1) * pageSize;
  return results.slice(start, start + pageSize);
}

export function countSeedProducts(options: SeedFilterOptions): number {
  return applyFilters({ ...options, page: 1, pageSize: Number.MAX_SAFE_INTEGER }).length;
}

export function getRelatedSeedProducts(
  slug: string,
  category: string,
  limit = 4,
): Product[] {
  return SEEDED.filter((p) => p.category === category && p.slug !== slug).slice(0, limit);
}

export function countByCategory(): Record<string, number> {
  return SEEDED.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
}
