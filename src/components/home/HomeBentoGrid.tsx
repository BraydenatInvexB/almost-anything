import { getProducts } from "@/services/product-service";
import { BoldHome } from "@/components/home/BoldHome";
import { ProductGrid } from "@/components/home/ProductGrid";

interface HomeBentoGridProps {
  category?: string;
  query?: string;
}

export async function HomeBentoGrid({ category, query }: HomeBentoGridProps) {
  const [{ data: products }, { data: featured }, { data: deals }] = await Promise.all([
    getProducts({ category, query, pageSize: 12 }),
    getProducts({ featuredOnly: true, pageSize: 8 }),
    getProducts({ dealsOnly: true, pageSize: 6 }),
  ]);

  const seen = new Set<string>();
  const pool = [...featured, ...deals, ...products].filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });

  const showFullGrid = Boolean(category || query);

  if (!pool.length) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-neutral-400">
        Loading catalog...
      </div>
    );
  }

  /* ── Filtered / search view ── */
  if (showFullGrid) {
    const title = query
      ? `Results for "${query}"`
      : category
        ? category.charAt(0).toUpperCase() + category.slice(1)
        : "All Products";
    return (
      <div className="mt-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2 rounded-2xl border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0_0_#000]">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black sm:text-3xl">{title}</h2>
          <span className="rounded-full border-2 border-black bg-brand px-3 py-1 text-xs font-extrabold uppercase text-white">
            {pool.length} items
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProductGrid products={pool} />
        </div>
      </div>
    );
  }

  /* ── Landing ── */
  return <BoldHome pool={pool} deals={deals} />;
}
