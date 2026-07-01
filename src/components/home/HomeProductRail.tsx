"use client";

import { ProductCard } from "@/components/products/ProductCard";
import type { ProductCardData } from "@/types";

const MAX = 8;

/**
 * Homepage product rail — full grid when stocked, horizontal scroll when sparse
 * so two items don't sit in an empty four-column layout.
 */
export function HomeProductRail({ products }: { products: ProductCardData[] }) {
  const items = products.slice(0, MAX);
  if (!items.length) return null;

  if (items.length >= 4) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {items.map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < 4} />
        ))}
      </div>
    );
  }

  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-1 snap-x snap-mandatory [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
      {items.map((product, i) => (
        <div
          key={product.id}
          className="w-[min(72vw,16rem)] shrink-0 snap-start sm:w-64"
        >
          <ProductCard product={product} priority={i < 2} />
        </div>
      ))}
    </div>
  );
}
