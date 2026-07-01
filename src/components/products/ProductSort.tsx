"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowDownUp } from "lucide-react";

const OPTIONS: { value: string; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export function ProductSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("sort") ?? "featured";

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "featured") params.delete("sort");
    else params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm shadow-sm">
      <ArrowDownUp className="h-4 w-4 shrink-0 text-neutral-400" />
      <span className="hidden text-neutral-500 sm:inline">Sort by</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[10rem] cursor-pointer truncate bg-transparent font-semibold text-neutral-900 focus:outline-none sm:max-w-none"
        aria-label="Sort products"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
