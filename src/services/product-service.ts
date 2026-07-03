import type { Product, ProductCardData, PaginatedResponse } from "@/types";
import type { ProductCategory } from "@/types/database";
import type { StorefrontSectionId } from "@/config/storefront-sections";
import { STOREFRONT_SECTION_BY_ID } from "@/config/storefront-sections";
import {
  filterSeedProducts,
  countSeedProducts,
  mapProductToCard,
  getProductBySlugSeed,
  getRelatedSeedProducts,
  type SortKey,
} from "@/lib/data/seed-products";
import {
  hasSupabaseProducts,
  isLiveCatalogReady,
  shouldQuerySupabase,
} from "@/lib/catalog/catalog-source";
import { resolveStoreProduct, resolveStoreProductCard } from "@/lib/pricing/resolve-store-product";
import { productMatchesModelIntent } from "@/lib/catalog/product-model-match";
import { significantSearchTokens } from "@/lib/sourcing/query-relevance";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export interface ProductQueryOptions {
  category?: ProductCategory | string;
  query?: string;
  slugs?: string[];
  page?: number;
  pageSize?: number;
  sort?: SortKey;
  featuredOnly?: boolean;
  dealsOnly?: boolean;
  section?: StorefrontSectionId;
}

const SORT_COLUMNS: Record<SortKey, { column: string; ascending: boolean }> = {
  featured: { column: "is_featured", ascending: false },
  newest: { column: "created_at", ascending: false },
  price_asc: { column: "retail_price", ascending: true },
  price_desc: { column: "retail_price", ascending: false },
  rating: { column: "rating", ascending: false },
};

function escapeIlike(term: string): string {
  return term.replace(/[%_,]/g, " ").trim();
}

function searchTokens(query: string): string[] {
  return significantSearchTokens(query)
    .map((t) => escapeIlike(t))
    .filter((t) => t.length >= 2);
}

function buildSingleTermOrClause(term: string): string {
  const slugTerm = term.replace(/\s+/g, "-");
  return [
    `name.ilike.%${term}%`,
    `description.ilike.%${term}%`,
    `slug.ilike.%${slugTerm}%`,
    `metadata->sourcing->>query.ilike.%${term}%`,
  ].join(",");
}

function tokenOrClause(token: string): string {
  return [
    `name.ilike.%${token}%`,
    `description.ilike.%${token}%`,
    `metadata->sourcing->>query.ilike.%${token}%`,
  ].join(",");
}

/** Apply search filters — multi-word queries require every token in name or description. */
function applySearchFilter<T extends { or: (clause: string) => T }>(
  query: T,
  searchQuery: string,
): T {
  const phrase = escapeIlike(searchQuery.trim());
  const tokens = searchTokens(searchQuery);

  if (!phrase) return query;

  if (tokens.length <= 1) {
    return query.or(buildSingleTermOrClause(phrase));
  }

  // Avoid false positives like "hair" matching "armchair" via slug — token-AND on name/description/sourcing query.
  let filtered = query;
  for (const token of tokens) {
    filtered = filtered.or(tokenOrClause(token));
  }
  return filtered;
}

async function querySupabaseProducts(
  options: ProductQueryOptions,
): Promise<PaginatedResponse<ProductCardData> | null> {
  const { page = 1, pageSize = 12 } = options;

  try {
    const supabase = await createClient();
    const sortCol = SORT_COLUMNS[options.sort ?? "featured"];
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order(sortCol.column, { ascending: sortCol.ascending });

    if (options.category && options.category !== "all") {
      query = query.eq("category", options.category as ProductCategory);
    }

    if (options.slugs?.length) {
      query = query.in("slug", options.slugs.slice(0, 50));
    } else if (options.query?.trim()) {
      query = applySearchFilter(query, options.query.trim());
    }

    if (options.featuredOnly) {
      query = query.eq("is_featured", true);
    }

    if (options.dealsOnly) {
      query = query.eq("is_deal", true);
    }

    if (options.section) {
      const col = STOREFRONT_SECTION_BY_ID[options.section].column;
      query = query.eq(col, true);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) return null;

    const searchQ = options.query?.trim();
    const filtered = searchQ
      ? (data ?? []).filter((row) =>
          productMatchesModelIntent(
            searchQ,
            row.name as string,
            row.description as string,
          ),
        )
      : (data ?? []);

    const total = searchQ ? filtered.length : (count ?? 0);
    return {
      data: filtered.map(resolveStoreProductCard),
      page,
      pageSize,
      total,
      hasMore: searchQ
        ? false
        : (page - 1) * pageSize + filtered.length < total,
    };
  } catch {
    return null;
  }
}

export async function searchCatalogProductSlugs(query: string): Promise<string[]> {
  if (!shouldQuerySupabase()) return [];

  const q = query.trim();
  if (!q) return [];

  try {
    const supabase = createServiceClient();
    let dbQuery = supabase.from("products").select("slug, name, description");
    dbQuery = applySearchFilter(dbQuery, q);
    const { data } = await dbQuery.limit(8);

    return (data ?? [])
      .filter((row) =>
        productMatchesModelIntent(
          q,
          row.name as string,
          row.description as string,
        ),
      )
      .map((row) => row.slug as string);
  } catch {
    return [];
  }
}

export async function getProducts(
  options: ProductQueryOptions = {},
): Promise<PaginatedResponse<ProductCardData>> {
  const { page = 1, pageSize = 12 } = options;
  const isSearch = Boolean(options.query?.trim());

  if (shouldQuerySupabase()) {
    const useSupabase =
      isSearch || (await isLiveCatalogReady()) || (await hasSupabaseProducts());

    if (useSupabase) {
      const result = await querySupabaseProducts(options);
      if (result) {
        if (isSearch || result.total > 0 || result.data.length > 0) {
          return result;
        }
      }
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

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (shouldQuerySupabase()) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) return resolveStoreProduct(data);
    } catch {
      /* fall through */
    }
  }

  return getProductBySlugSeed(slug) ?? null;
}

export async function getRelatedProducts(
  slug: string,
  category: string,
  limit = 4,
): Promise<ProductCardData[]> {
  if (shouldQuerySupabase()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category", category as ProductCategory)
        .neq("slug", slug)
        .limit(limit);
      if (data?.length) return data.map(resolveStoreProductCard);
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
  const result = await getProducts({ section: "steals", pageSize: 4 });
  if (result.data.length) return result.data;
  return (await getProducts({ dealsOnly: true, pageSize: 4 })).data;
}

export async function getStealsProducts(): Promise<ProductCardData[]> {
  return getDealProducts();
}

export async function getHotProducts(): Promise<ProductCardData[]> {
  const result = await getProducts({ section: "hot", pageSize: 8 });
  if (result.data.length) return result.data;
  return (await getProducts({ featuredOnly: true, pageSize: 8 })).data;
}

export async function getFreshDropProducts(): Promise<ProductCardData[]> {
  return (await getProducts({ section: "fresh", pageSize: 8 })).data;
}
