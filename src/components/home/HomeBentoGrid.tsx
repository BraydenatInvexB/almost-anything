import { getProducts, getHotProducts, getStealsProducts, getFreshDropProducts } from "@/services/product-service";
import { getPublicStorefrontConfig } from "@/services/storefront-settings-service";
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
      <div className="mt-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2 rounded-2xl border-[3px] border-black bg-white px-5 py-4 shadow-[5px_5px_0_0_#000]">
          <h2 className="text-2xl font-black uppercase tracking-tight text-black sm:text-3xl">{title}</h2>
          <span className="rounded-full border-2 border-black bg-brand px-3 py-1 text-xs font-extrabold uppercase text-white">
            {products.length} items
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ProductGrid products={products} />
        </div>
      </div>
    );
  }

  const [hot, steals, fresh, storefrontConfig] = await Promise.all([
    getHotProducts(),
    getStealsProducts(),
    getFreshDropProducts(),
    getPublicStorefrontConfig(),
  ]);

  if (!hot.length && !steals.length && !fresh.length) {
    const { data: fallback } = await getProducts({ pageSize: 12 });
    if (!fallback.length) {
      return (
        <div className="flex min-h-[400px] items-center justify-center text-neutral-400">
          Loading catalog...
        </div>
      );
    }
    return (
      <BoldHome
        hot={fallback.slice(0, 8)}
        steals={fallback.slice(4, 8)}
        fresh={fallback.slice(0, 8)}
        heroShowcase={storefrontConfig.heroShowcase}
      />
    );
  }

  return (
    <BoldHome
      hot={hot}
      steals={steals}
      fresh={fresh}
      heroShowcase={storefrontConfig.heroShowcase}
    />
  );
}
