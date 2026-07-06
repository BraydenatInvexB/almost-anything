"use client";

import { useEffect } from "react";
import { ProductGrid } from "@/components/home/ProductGrid";
import { useProductsSearchResults } from "@/components/products/ProductsSearchProvider";
import type { ProductCardData } from "@/types";

type Props = {
  initialProducts: ProductCardData[];
  initialTotal: number;
};

export function ProductsSearchSection({ initialProducts, initialTotal }: Props) {
  const { setTotal } = useProductsSearchResults();

  useEffect(() => {
    setTotal(initialTotal);
  }, [initialTotal, setTotal]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
      <ProductGrid
        products={initialProducts}
        showEmpty={initialTotal > 0 || initialProducts.length > 0}
      />
    </div>
  );
}
