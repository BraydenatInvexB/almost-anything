import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getGroupedCategories } from "@/config/categories";

export const metadata = {
  title: "All Categories",
  description: "Browse every product category at Almost Anything.",
};

export default function CategoriesPage() {
  const groups = getGroupedCategories();

  return (
    <div className="flex min-h-full flex-col bg-neutral-50">
      <SiteHeader variant="page" />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <nav
          className="mb-5 flex items-center gap-1.5 text-xs text-neutral-400"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="transition-colors hover:text-neutral-700">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className="font-medium text-neutral-700">Categories</span>
        </nav>

        <header className="rounded-2xl border border-neutral-200 bg-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            All categories
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500 sm:text-base">
            Browse the full catalog by category — from electronics and fashion to travel,
            baby, and more.
          </p>
        </header>

        <div className="mt-8 space-y-10">
          {groups.map(({ group, categories }) => (
            <section key={group.id} aria-labelledby={`category-group-${group.id}`}>
              <div className="mb-4 flex items-end justify-between gap-4">
                <h2
                  id={`category-group-${group.id}`}
                  className="text-lg font-bold text-neutral-900 sm:text-xl"
                >
                  {group.label}
                </h2>
                <span className="text-xs font-medium text-neutral-400">
                  {categories.length} categories
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:border-neutral-900 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                      <Image
                        src={cat.image}
                        alt={cat.label}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-transparent to-transparent" />
                      <span
                        className="absolute left-2.5 top-2.5 h-2 w-2 rounded-full border border-white/50"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden
                      />
                      <p className="absolute inset-x-0 bottom-0 px-3 pb-2.5 text-sm font-semibold text-white">
                        {cat.label}
                      </p>
                    </div>
                    <p className="line-clamp-2 px-3 py-2.5 text-xs leading-snug text-neutral-500">
                      {cat.blurb}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand"
          >
            Browse all products
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
