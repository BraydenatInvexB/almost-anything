import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductGrid } from "@/components/home/ProductGrid";
import { ProductsSearchSection } from "@/components/products/ProductsSearchSection";
import {
  ProductsSearchProvider,
  ProductsSearchSubtitle,
} from "@/components/products/ProductsSearchProvider";
import { ProductSort } from "@/components/products/ProductSort";
import { CategoryFilterRail } from "@/components/products/CategoryFilterRail";
import { ProductsCategorySidebar } from "@/components/products/ProductsCategorySidebar";
import { ActiveFilterChips } from "@/components/products/ActiveFilterChips";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getProducts } from "@/services/product-service";
import { STORE_CATEGORIES, getCategory } from "@/config/categories";
import type { SortKey } from "@/lib/data/seed-products";
import type { StorefrontSectionId } from "@/config/storefront-sections";
import { STOREFRONT_SECTION_BY_ID } from "@/config/storefront-sections";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    sort?: string;
    deals?: string;
    section?: string;
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

function CategoryNavFallback() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-24 shrink-0 animate-pulse rounded-full bg-neutral-200"
        />
      ))}
    </div>
  );
}

function SidebarFallback() {
  return (
    <div className="hidden w-64 shrink-0 space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 xl:w-72 lg:block">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const pageSize = 16;
  const activeCat = getCategory(params.category);

  const dealsOnly = params.deals === "true";
  const sectionId = params.section as StorefrontSectionId | undefined;
  const sectionMeta = sectionId ? STOREFRONT_SECTION_BY_ID[sectionId] : undefined;

  const { data: products, total, hasMore } = await getProducts({
    query: params.q,
    category: params.category,
    sort: params.sort as SortKey | undefined,
    dealsOnly: dealsOnly && !sectionMeta,
    section: sectionMeta ? sectionId : undefined,
    page,
    pageSize,
  });

  const heading = params.q
    ? `Results for “${params.q}”`
    : sectionMeta
      ? sectionMeta.title
      : dealsOnly
        ? "Today's Deals"
        : activeCat?.label ?? "All Products";

  const subtitleBlurb =
    activeCat?.blurb ??
    sectionMeta?.kicker ??
    "Almost everything you need, all in one place.";

  const filterChips: { label: string; clearHref: string }[] = [];
  if (activeCat) {
    filterChips.push({
      label: activeCat.label,
      clearHref: `/products${buildQuery({ q: params.q, sort: params.sort, deals: params.deals, section: params.section })}`,
    });
  }
  if (dealsOnly && !sectionMeta) {
    filterChips.push({
      label: "Deals",
      clearHref: `/products${buildQuery({ category: params.category, q: params.q, sort: params.sort })}`,
    });
  }
  if (sectionMeta) {
    filterChips.push({
      label: sectionMeta.title,
      clearHref: `/products${buildQuery({ category: params.category, q: params.q, sort: params.sort })}`,
    });
  }

  const pageBody = (
    <>
      {/* Page hero */}
      <header className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {activeCat ? (
              <span
                className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: `${activeCat.color}18`,
                  color: activeCat.color,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: activeCat.color }}
                />
                {activeCat.label}
              </span>
            ) : null}
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
              {heading}
            </h1>
            {params.q ? (
              <ProductsSearchSubtitle blurb={subtitleBlurb} />
            ) : (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-base">
                {subtitleBlurb}
                <span className="mt-1 block text-neutral-400 sm:mt-0 sm:inline">
                  {" "}
                  · {total} {total === 1 ? "product" : "products"}
                </span>
              </p>
            )}
          </div>
          <div className="shrink-0">
            <ProductSort />
          </div>
        </div>

        <ActiveFilterChips chips={filterChips} />

        {/* Mobile category rail */}
        <div className="mt-5 lg:hidden">
          <Suspense fallback={<CategoryNavFallback />}>
            <CategoryFilterRail activeCategory={params.category} />
          </Suspense>
        </div>
      </header>

      <div className="mt-8 flex gap-10">
        {/* Desktop sidebar */}
        <Suspense fallback={<SidebarFallback />}>
          <aside className="hidden w-64 shrink-0 xl:w-72 lg:block">
            <ProductsCategorySidebar activeCategory={params.category} />
          </aside>
        </Suspense>

        <div className="min-w-0 flex-1">
          {params.q ? (
            <ProductsSearchSection
              initialProducts={products}
              initialTotal={total}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              <ProductGrid products={products} />
            </div>
          )}

          {(page > 1 || hasMore) && products.length > 0 && (
            <nav
              className="mt-12 flex items-center justify-center gap-3"
              aria-label="Pagination"
            >
              {page > 1 ? (
                <Link
                  href={`/products${buildQuery({
                    category: params.category,
                    q: params.q,
                    sort: params.sort,
                    deals: params.deals,
                    section: params.section,
                    page: String(page - 1),
                  })}`}
                >
                  <Button variant="secondary">Previous</Button>
                </Link>
              ) : null}
              <span className="min-w-[5rem] text-center text-sm font-medium text-neutral-500">
                Page {page}
              </span>
              {hasMore ? (
                <Link
                  href={`/products${buildQuery({
                    category: params.category,
                    q: params.q,
                    sort: params.sort,
                    deals: params.deals,
                    section: params.section,
                    page: String(page + 1),
                  })}`}
                >
                  <Button>Next</Button>
                </Link>
              ) : null}
            </nav>
          )}

          {products.length === 0 && params.q ? (
            <Card variant="elevated" className="mt-4 border border-dashed border-neutral-300 bg-white py-20 text-center shadow-none">
              <p className="text-lg font-semibold text-neutral-900">
                No products match &ldquo;{params.q}&rdquo;
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                Search only includes products already listed on our site. Try different keywords, browse
                categories, or tell us what you need.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link href="/products">
                  <Button>Browse all products</Button>
                </Link>
                <Link href="/request">
                  <Button variant="secondary">Request a product</Button>
                </Link>
              </div>
            </Card>
          ) : null}

          {products.length === 0 && !params.q ? (
            <Card variant="elevated" className="mt-4 border border-dashed border-neutral-300 bg-white py-20 text-center shadow-none">
              <p className="text-lg font-semibold text-neutral-900">
                No products in this category yet
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
                We are always sourcing new stock. Try another category or browse the full catalog.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link href="/products">
                  <Button>Browse all products</Button>
                </Link>
                {STORE_CATEGORIES.slice(0, 4).map((cat) => (
                  <Link key={cat.slug} href={`/products?category=${cat.slug}`}>
                    <Button variant="secondary">{cat.label}</Button>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <SiteHeader activeCategory={params.category} searchQuery={params.q} variant="page" />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <nav
          className="mb-5 flex items-center gap-1.5 text-xs text-neutral-400"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-neutral-700">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <Link href="/products" className="transition-colors hover:text-neutral-700">
            Shop
          </Link>
          {activeCat && (
            <>
              <ChevronRight className="h-3 w-3" aria-hidden />
              <span className="font-medium text-neutral-700">{activeCat.label}</span>
            </>
          )}
        </nav>

        {params.q ? (
          <ProductsSearchProvider initialTotal={total}>
            {pageBody}
          </ProductsSearchProvider>
        ) : (
          pageBody
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
