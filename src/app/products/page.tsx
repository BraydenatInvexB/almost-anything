import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductGrid } from "@/components/home/ProductGrid";
import { ProductSort } from "@/components/products/ProductSort";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getProducts } from "@/services/product-service";
import { STORE_CATEGORIES, getCategory } from "@/config/categories";
import type { SortKey } from "@/lib/data/seed-products";
import { cn } from "@/lib/utils/cn";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    sort?: string;
    deals?: string;
  }>;
}

function buildQuery(base: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v) params.set(k, v);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const pageSize = 16;
  const activeCat = getCategory(params.category);

  const dealsOnly = params.deals === "true";

  const { data: products, total, hasMore } = await getProducts({
    query: params.q,
    category: params.category,
    sort: params.sort as SortKey | undefined,
    dealsOnly,
    page,
    pageSize,
  });

  const heading = params.q
    ? `Results for “${params.q}”`
    : dealsOnly
      ? "Today's Deals"
      : activeCat?.label ?? "All Products";

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader activeCategory={params.category} searchQuery={params.q} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Link href="/" className="hover:text-neutral-700">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/products" className="hover:text-neutral-700">
            Shop
          </Link>
          {activeCat && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="font-medium text-neutral-700">{activeCat.label}</span>
            </>
          )}
        </nav>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{heading}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {activeCat?.blurb ?? "Almost everything you need, all in one place."} ·{" "}
              {total} {total === 1 ? "product" : "products"}
            </p>
          </div>
          <ProductSort />
        </div>

        {/* Category rail */}
        <div className="mt-5 -mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            <Link
              href={buildQuery({ q: params.q, sort: params.sort })}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                !params.category
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 shadow-sm hover:bg-neutral-50",
              )}
            >
              All
            </Link>
            {STORE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products${buildQuery({ category: cat.slug, q: params.q, sort: params.sort })}`}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  params.category === cat.slug
                    ? "bg-neutral-900 text-white"
                    : "bg-white text-neutral-600 shadow-sm hover:bg-neutral-50",
                )}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <ProductGrid products={products} />
        </div>

        {(page > 1 || hasMore) && products.length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link
                href={`/products${buildQuery({ category: params.category, q: params.q, sort: params.sort, page: String(page - 1) })}`}
              >
                <Button variant="secondary">Previous</Button>
              </Link>
            ) : null}
            <span className="text-sm text-neutral-500">Page {page}</span>
            {hasMore ? (
              <Link
                href={`/products${buildQuery({ category: params.category, q: params.q, sort: params.sort, page: String(page + 1) })}`}
              >
                <Button>Next</Button>
              </Link>
            ) : null}
          </div>
        )}

        {products.length === 0 ? (
          <Card variant="elevated" className="mt-8 bg-white py-16 text-center">
            <p className="text-neutral-600">No products match your search.</p>
            <p className="mt-1 text-sm text-neutral-400">
              Try a different keyword or browse a category.
            </p>
            <Link href="/products" className="mt-5 inline-block">
              <Button>Browse all products</Button>
            </Link>
          </Card>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
