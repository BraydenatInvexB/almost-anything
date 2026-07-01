"use client";

import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import type { ProductCardData } from "@/types";

interface ProductGridProps {
  products: ProductCardData[];
  showEmpty?: boolean;
}

export function ProductGrid({ products, showEmpty = true }: ProductGridProps) {
  if (products.length === 0) {
    if (!showEmpty) return null;
    return (
      <div className="col-span-full flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
        <span className="text-4xl" aria-hidden>
          🔍
        </span>
        <p className="text-base font-semibold text-neutral-900">No products found</p>
        <p className="max-w-sm text-sm text-neutral-500">
          Try a different search term or browse another category.
        </p>
        <Link
          href="/products"
          className="mt-2 inline-flex items-center rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand"
        >
          Browse all products
        </Link>
      </div>
    );
  }

  return (
    <>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 4} />
      ))}
    </>
  );
}
