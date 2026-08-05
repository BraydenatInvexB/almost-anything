import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { HOME_CATEGORY_STRIP } from "@/config/home-marketplace";
import { cn } from "@/lib/utils/cn";

export function HomeCategoryStrip() {
  return (
    <section className="flex items-start gap-3 sm:gap-4">
      <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 lg:gap-5 [&::-webkit-scrollbar]:hidden">
        {HOME_CATEGORY_STRIP.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.label}
              href={cat.href}
              className="group flex w-[4.75rem] shrink-0 flex-col items-center gap-2.5 sm:w-[5.25rem]"
            >
              <span
                className={cn(
                  "flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full transition-transform group-hover:scale-105 sm:h-[4.75rem] sm:w-[4.75rem]",
                  cat.featured
                    ? "bg-brand-soft text-brand"
                    : "bg-[#f3f4f6] text-neutral-700 group-hover:text-brand",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <span
                className={cn(
                  "line-clamp-2 text-center text-[11px] font-medium leading-snug sm:text-xs",
                  cat.featured
                    ? "text-brand"
                    : "text-neutral-700 group-hover:text-brand",
                )}
              >
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/products"
        className="hidden shrink-0 flex-col items-center gap-2.5 pt-1 text-center sm:flex"
      >
        <span className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-dashed border-neutral-300 text-neutral-500 transition-colors hover:border-brand hover:text-brand sm:h-[4.75rem] sm:w-[4.75rem]">
          <LayoutGrid className="h-5 w-5" strokeWidth={1.6} />
        </span>
        <span className="max-w-[4.75rem] text-[11px] font-semibold leading-snug text-neutral-700 sm:text-xs">
          View all Categories
        </span>
      </Link>
    </section>
  );
}
