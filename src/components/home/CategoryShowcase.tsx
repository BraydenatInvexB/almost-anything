import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { STORE_CATEGORIES } from "@/config/categories";

const FEATURED = [
  "electronics",
  "furniture",
  "audio",
  "fashion",
  "kitchen",
  "gaming",
  "beauty",
  "sports",
];

export function CategoryShowcase() {
  const cats = FEATURED.map((slug) => STORE_CATEGORIES.find((c) => c.slug === slug)).filter(
    (c): c is (typeof STORE_CATEGORIES)[number] => Boolean(c),
  );

  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Browse the store
          </span>
          <h2 className="mt-1 text-xl font-bold text-neutral-900">Shop by category</h2>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
        >
          All categories
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cats.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className="group relative aspect-4/3 overflow-hidden rounded-3xl ring-1 ring-neutral-200"
          >
            <Image
              src={cat.image}
              alt={cat.label}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-neutral-900/80 via-neutral-900/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
              <span className="text-sm font-bold text-white">{cat.label}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-neutral-900 opacity-0 transition-opacity group-hover:opacity-100">
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
