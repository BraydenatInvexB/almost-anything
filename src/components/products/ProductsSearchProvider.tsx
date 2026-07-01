"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { CUSTOMER_WAREHOUSE_FINDING_MESSAGES } from "@/config/warehouse-copy";

type SearchResultsContextValue = {
  total: number;
  setTotal: (total: number) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;
};

const SearchResultsContext = createContext<SearchResultsContextValue | null>(null);

export function ProductsSearchProvider({
  initialTotal,
  query,
  children,
}: {
  initialTotal: number;
  query: string;
  children: ReactNode;
}) {
  const [total, setTotal] = useState(initialTotal);
  const [isSearching, setIsSearching] = useState(initialTotal === 0 && query.trim().length > 0);

  return (
    <SearchResultsContext.Provider value={{ total, setTotal, isSearching, setIsSearching }}>
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
  const { total, isSearching } = useProductsSearchResults();
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isSearching || total > 0) return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % CUSTOMER_WAREHOUSE_FINDING_MESSAGES.length);
    }, 3200);
    return () => clearInterval(id);
  }, [isSearching, total]);

  if (isSearching && total === 0) {
    return (
      <p className="mt-1 text-sm text-neutral-500">
        {blurb ?? "Almost everything you need, all in one place."} ·{" "}
        {CUSTOMER_WAREHOUSE_FINDING_MESSAGES[messageIndex]}
      </p>
    );
  }

  return (
    <p className="mt-1 text-sm text-neutral-500">
      {blurb ?? "Almost everything you need, all in one place."} · {total}{" "}
      {total === 1 ? "product" : "products"}
    </p>
  );
}
