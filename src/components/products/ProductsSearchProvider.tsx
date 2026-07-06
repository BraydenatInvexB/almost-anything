"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type SearchResultsContextValue = {
  total: number;
  setTotal: (total: number) => void;
};

const SearchResultsContext = createContext<SearchResultsContextValue | null>(null);

export function ProductsSearchProvider({
  initialTotal,
  children,
}: {
  initialTotal: number;
  query?: string;
  children: ReactNode;
}) {
  const [total, setTotal] = useState(initialTotal);

  return (
    <SearchResultsContext.Provider value={{ total, setTotal }}>
      {children}
    </SearchResultsContext.Provider>
  );
}

export function useProductsSearchResults() {
  const ctx = useContext(SearchResultsContext);
  if (!ctx) {
    throw new Error("useProductsSearchResults must be used within ProductsSearchProvider");
  }
  return ctx;
}

export function ProductsSearchSubtitle({ blurb }: { blurb?: string }) {
  const { total } = useProductsSearchResults();

  return (
    <p className="mt-1 text-sm text-neutral-500">
      {blurb ?? "Almost everything you need, all in one place."} · {total}{" "}
      {total === 1 ? "product" : "products"} in our catalog
    </p>
  );
}
