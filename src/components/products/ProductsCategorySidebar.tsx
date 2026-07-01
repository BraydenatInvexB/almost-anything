"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { getGroupedCategories } from "@/config/categories";
import { cn } from "@/lib/utils/cn";

function buildHref(
  base: Record<string, string | undefined>,
  category?: string,
) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v) params.set(k, v);
  }
  if (category) params.set("category", category);
  const s = params.toString();
  return `/products${s ? `?${s}` : ""}`;
}

interface ProductsCategorySidebarProps {
  activeCategory?: string;
}

export function ProductsCategorySidebar({ activeCategory }: ProductsCategorySidebarProps) {
  const searchParams = useSearchParams();
  const baseQuery = {
    q: searchParams.get("q") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    deals: searchParams.get("deals") ?? undefined,
    section: searchParams.get("section") ?? undefined,
  };

  const groups = getGroupedCategories();

  return (
    <nav
      aria-label="Browse by category"
      className="sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col rounded-2xl border border-neutral-200 bg-white shadow-sm"
    >
      <div className="border-b border-neutral-100 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Shop by category
        </p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        <Link
          href={buildHref(baseQuery)}
          className={cn(
            "mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            !activeCategory
              ? "bg-neutral-900 text-white"
              : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
          )}
        >
          <LayoutGrid className="h-4 w-4 shrink-0 opacity-70" />
          All products
        </Link>

        {groups.map(({ group, categories }) => (
          <div key={group.id} className="mb-3 last:mb-0">
            <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={buildHref(baseQuery, cat.slug)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      activeCategory === cat.slug
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
                    )}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          activeCategory === cat.slug ? "#fff" : cat.color,
                      }}
                    />
                    <span className="line-clamp-1">{cat.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
