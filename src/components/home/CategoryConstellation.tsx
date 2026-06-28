import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { STORE_CATEGORIES } from "@/config/categories";

/**
 * Futuristic, free-flowing cloud of category pills. Sizes vary to create a
 * "constellation" rhythm while keeping the brand's pill shape and accent dots.
 */
const SIZES = [
  "text-base px-5 py-3",
  "text-sm px-4 py-2.5",
  "text-sm px-4 py-2",
  "text-[15px] px-5 py-2.5",
];

export function CategoryConstellation() {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-white p-7 shadow-sm sm:p-9">
      {/* faint accent glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(205,255,0,0.25), transparent 70%)" }}
      />

      <div className="relative flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Explore the universe
        </span>
        <h2 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
          Every category, one store
        </h2>
      </div>

      <div className="relative mt-7 flex flex-wrap items-center gap-2.5">
        {STORE_CATEGORIES.map((cat, i) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className={`group flex items-center gap-2.5 rounded-full border border-neutral-200 bg-neutral-50 font-medium text-neutral-800 transition-all hover:-translate-y-0.5 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white hover:shadow-lg ${SIZES[i % SIZES.length]}`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform group-hover:scale-125"
              style={{ backgroundColor: cat.color }}
            />
            {cat.label}
          </Link>
        ))}

        <Link
          href="/products"
          className="group flex items-center gap-2 rounded-full bg-[#CDFF00] px-5 py-2.5 text-sm font-bold text-neutral-900 transition-all hover:scale-[1.03] hover:shadow-[0_0_24px_-6px_rgba(205,255,0,0.8)]"
        >
          Browse all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
