"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { STORE_CATEGORIES } from "@/config/categories";
import { productsBrowseHref } from "@/lib/catalog/products-url";
import { cn } from "@/lib/utils/cn";

interface CategoryFilterRailProps {
  activeCategory?: string;
  className?: string;
}

export function CategoryFilterRail({ activeCategory, className }: CategoryFilterRailProps) {
  const searchParams = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sort = searchParams.get("sort") ?? undefined;
  const isSearchMode = Boolean(searchParams.get("q")?.trim());
  const allProductsActive = !activeCategory && !isSearchMode;

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollHints();
    el.addEventListener("scroll", updateScrollHints, { passive: true });
    const ro = new ResizeObserver(updateScrollHints);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollHints);
      ro.disconnect();
    };
  }, [updateScrollHints]);

  function scrollByDir(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  return (
    <div className={cn("relative", className)}>
      {canScrollLeft ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-neutral-50 to-transparent" />
      ) : null}
      {canScrollRight ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-neutral-50 to-transparent" />
      ) : null}

      {canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByDir(-1)}
          className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-1.5 text-neutral-600 shadow-sm hover:border-neutral-400 sm:flex"
          aria-label="Scroll categories left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      ) : null}

      {canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByDir(1)}
          className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-1.5 text-neutral-600 shadow-sm hover:border-neutral-400 sm:flex"
          aria-label="Scroll categories right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : null}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Link
          href={productsBrowseHref({ sort })}
          className={cn(
            "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            !allProductsActive
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900",
          )}
        >
          All
        </Link>
        {STORE_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={productsBrowseHref({ category: cat.slug, sort })}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activeCategory === cat.slug
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 hover:text-neutral-900",
            )}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: activeCategory === cat.slug ? "#fff" : cat.color,
              }}
            />
            {cat.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
