import Link from "next/link";
import { STORE_CATEGORIES } from "@/config/categories";

const FEATURED_SLUGS = [
  "electronics",
  "furniture",
  "home",
  "kitchen",
  "audio",
  "fashion",
  "gaming",
  "sports",
];

export function CategoriesWidget() {
  const categories = STORE_CATEGORIES.filter((c) => FEATURED_SLUGS.includes(c.slug));

  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm">
      <p className="mb-4 text-[13px] font-semibold text-neutral-900">Shop by Category</p>
      <div className="flex flex-wrap items-center gap-2.5">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className="group flex items-center gap-2 rounded-full border border-neutral-100 bg-neutral-50 px-3 py-1.5 transition-all hover:border-neutral-300 hover:bg-white hover:shadow-sm"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full transition-transform group-hover:scale-110"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-xs font-medium text-neutral-700">{cat.label}</span>
          </Link>
        ))}
        <Link
          href="/products"
          className="rounded-full border border-dashed border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-600"
        >
          All →
        </Link>
      </div>
    </div>
  );
}
