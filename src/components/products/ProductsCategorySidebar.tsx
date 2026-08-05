"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { getGroupedCategories } from "@/config/categories";
import { productsBrowseHref } from "@/lib/catalog/products-url";
import { cn } from "@/lib/utils/cn";

interface ProductsCategorySidebarProps {
  activeCategory?: string;
}

export function ProductsCategorySidebar({ activeCategory }: ProductsCategorySidebarProps) {
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") ?? undefined;
  const isSearchMode = Boolean(searchParams.get("q")?.trim());
  const allProductsActive = !activeCategory && !isSearchMode;

  const groups = getGroupedCategories();
  const activeGroup = groups.find(({ categories }) =>
    categories.some((category) => category.slug === activeCategory),
  )?.group.id;
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set([activeGroup ?? groups[0]?.group.id].filter(Boolean) as string[]),
  );

  function toggleGroup(groupId: string) {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  return (
    <nav
      aria-label="Browse by category"
      className="sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-[#faf9f7]"
    >
      <div className="px-4 pb-2 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">Catalogue</p>
        <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-neutral-950">Shop by category</p>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-3 pt-2">
        <Link
          href={productsBrowseHref({ sort })}
          className={cn(
            "mb-2 flex items-center gap-2.5 rounded-2xl px-3 py-3 text-sm font-semibold transition-colors",
            allProductsActive
              ? "bg-brand text-white shadow-[0_8px_20px_rgba(235,0,20,0.16)]"
              : "bg-white text-neutral-800 hover:text-brand",
          )}
        >
          <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", allProductsActive ? "bg-white/15" : "bg-neutral-100")}>
            <LayoutGrid className="h-4 w-4 shrink-0" />
          </span>
          All products
        </Link>

        {groups.map(({ group, categories }) => {
          const isOpen = openGroups.has(group.id);
          return (
          <div key={group.id} className="mb-1 overflow-hidden rounded-2xl bg-white last:mb-0">
            <button type="button" onClick={() => toggleGroup(group.id)} className="flex w-full items-center gap-2 px-3 py-3 text-left">
              <span className="min-w-0 flex-1 text-xs font-semibold text-neutral-800">{group.label}</span>
              <span className="text-[10px] font-medium text-neutral-400">{categories.length}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-neutral-400 transition-transform", isOpen && "rotate-180")} />
            </button>
            {isOpen ? (
              <ul className="space-y-0.5 px-2 pb-2">
                {categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={productsBrowseHref({ category: cat.slug, sort })}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors",
                        activeCategory === cat.slug
                          ? "bg-[#fff0f1] text-brand"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                      )}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="line-clamp-1">{cat.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          );
        })}
      </div>
    </nav>
  );
}
