import type { Product, ProductCardData, PaginatedResponse } from "@/types";
import type { ProductCategory } from "@/types/database";
import {
  filterSeedProducts,
  countSeedProducts,
  mapProductToCard,
  getProductBySlugSeed,
  getRelatedSeedProducts,
  type SortKey,
} from "@/lib/data/seed-products";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";

export interface ProductQueryOptions {
  category?: ProductCategory | string;
  query?: string;
  page?: number;
  pageSize?: number;
  sort?: SortKey;
  featuredOnly?: boolean;
  dealsOnly?: boolean;
}

const SORT_COLUMNS: Record<SortKey, { column: string; ascending: boolean }> = {
  featured: { column: "is_featured", ascending: false },
  newest: { column: "created_at", ascending: false },
  price_asc: { column: "retail_price", ascending: true },
  price_desc: { column: "retail_price", ascending: false },
  rating: { column: "rating", ascending: false },
};

export async function getProducts(
  options: ProductQueryOptions = {},
): Promise<PaginatedResponse<ProductCardData>> {
  const { page = 1, pageSize = 12 } = options;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const sortCol = SORT_COLUMNS[options.sort ?? "featured"];
      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .order(sortCol.column, { ascending: sortCol.ascending });

      if (options.category && options.category !== "all") {
        query = query.eq(
          "category",
          options.category as ProductCategory,
        );
      }

      if (options.query) {
        query = query.or(
          `name.ilike.%${options.query}%,description.ilike.%${options.query}%`,
        );
      }

      if (options.featuredOnly) {
        query = query.eq("is_featured", true);
      }

      if (options.dealsOnly) {
        query = query.eq("is_deal", true);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (!error && data && data.length > 0) {
        const total = count ?? data.length;
        return {
          data: data.map(mapProductToCard),
          page,
          pageSize,
          total,
          hasMore: from + data.length < total,
        };
      }
    } catch {
      // Fall through to seed data
    }
  }

  const seedResults = filterSeedProducts(options);
  const total = countSeedProducts(options);

  return {
    data: seedResults.map(mapProductToCard),
    page,
    pageSize,
    total,
    hasMore: page * pageSize < total,
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!error && data) return data;
    } catch {
      // Fall through
    }
  }

  return getProductBySlugSeed(slug) ?? null;
}

export async function getRelatedProducts(
  slug: string,
  category: string,
  limit = 4,
): Promise<ProductCardData[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category", category as ProductCategory)
        .neq("slug", slug)
        .limit(limit);
      if (data && data.length) return data.map(mapProductToCard);
    } catch {
      /* fall through */
    }
  }
  return getRelatedSeedProducts(slug, category, limit).map(mapProductToCard);
}

export async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const result = await getProducts({ featuredOnly: true, pageSize: 6 });
  return result.data;
}

export async function getDealProducts(): Promise<ProductCardData[]> {
  const result = await getProducts({ dealsOnly: true, pageSize: 4 });
  return result.data;
}
