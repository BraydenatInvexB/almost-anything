"use client";

import { useCallback, useEffect, useState } from "react";
import { ProductGrid } from "@/components/home/ProductGrid";
import { SearchDiscovery } from "@/components/products/SearchDiscovery";
import { useProductsSearchResults } from "@/components/products/ProductsSearchProvider";
import type { PaginatedResponse, ProductCardData } from "@/types";

type Props = {
  query: string;
  initialProducts: ProductCardData[];
  initialTotal: number;
};

export function ProductsSearchSection({
  query,
  initialProducts,
  initialTotal,
}: Props) {
  const { setTotal: setSearchTotal, setIsSearching } = useProductsSearchResults();
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);

  useEffect(() => {
    setProducts(initialProducts);
    setTotal(initialTotal);
    setSearchTotal(initialTotal);
  }, [initialProducts, initialTotal, setSearchTotal]);

  const handleProductsLoaded = useCallback(
    (result: PaginatedResponse<ProductCardData>) => {
      if (!result.data.length) return;
      setProducts(result.data);
      setTotal(result.total);
      setSearchTotal(result.total);
    },
    [setSearchTotal],
  );

  return (
    <>
      <SearchDiscovery
        query={query}
        initialCount={initialTotal}
        onSearchingChange={setIsSearching}
        onProductsLoaded={handleProductsLoaded}
      />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ProductGrid products={products} showEmpty={total > 0 || products.length > 0} />
      </div>
    </>
  );
}
