"use client";

import { Search } from "lucide-react";

export function SellerCatalogToolbar({
  query,
  onQueryChange,
  category,
  onCategoryChange,
  categories,
  placeholder = "Search products…",
  hideCategory = false,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  placeholder?: string;
  hideCategory?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          className="input h-10 pl-9"
        />
      </div>
      {!hideCategory ? (
        <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className="input h-10 w-auto min-w-[140px]">
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All categories" : cat.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
