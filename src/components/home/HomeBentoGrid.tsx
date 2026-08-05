import { getProducts, getHotProducts, getStealsProducts, getFreshDropProducts } from "@/services/product-service";
import { BoldHome } from "@/components/home/BoldHome";
import { ProductGrid } from "@/components/home/ProductGrid";

interface HomeBentoGridProps {
  category?: string;
  query?: string;
}

export async function HomeBentoGrid({ category, query }: HomeBentoGridProps) {
  const showFullGrid = Boolean(category || query);

  if (showFullGrid) {
    const { data: products } = await getProducts({ category, query, pageSize: 12 });
    const title = query
      ? `Results for "${query}"`
      : category
        ? category.charAt(0).toUpperCase() + category.slice(1)
        : "All Products";

    if (!products.length) {
      return (
        <div className="flex min-h-[400px] items-center justify-center text-neutral-400">
          No products match your search.
        </div>
      );
    }

    return (
      <div className="mt-2">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2 rounded-2xl border border-neutral-100 bg-[#f9f9f9] px-5 py-4">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{title}</h2>
          <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
            {products.length} items
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProductGrid products={products} />
        </div>
      </div>
    );
  }

  const [hot, steals, fresh] = await Promise.all([
    getHotProducts(),
    getStealsProducts(),
    getFreshDropProducts(),
  ]);

  return <BoldHome hot={hot} steals={steals} fresh={fresh} />;
}
