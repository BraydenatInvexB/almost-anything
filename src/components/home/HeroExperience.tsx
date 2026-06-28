import Link from "next/link";
import Image from "next/image";
import { Star, Sparkles } from "lucide-react";
import type { ProductCardData } from "@/types";
import { formatCurrency } from "@/lib/utils/cn";
import { AskSearch } from "@/components/home/AskSearch";

export function HeroExperience({ showcase }: { showcase: ProductCardData[] }) {
  const pics = showcase.slice(0, 3);

  return (
    <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_8px_40px_-20px_rgba(0,0,0,0.18)]">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
        {/* ── Left: copy + search ── */}
        <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs font-medium text-neutral-600">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Fresh stock added every week
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-900 sm:text-6xl">
            Almost anything,
            <br />
            <span className="text-brand">all in one store.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-500">
            Thousands of quality products at fair prices, delivered fast. Search
            for what you need and we&apos;ll do the rest.
          </p>

          <div className="mt-8 max-w-xl">
            <AskSearch />
          </div>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-neutral-500">
              <span className="font-semibold text-neutral-900">4.8/5</span> from
              over 12,000 shoppers
            </p>
          </div>
        </div>

        {/* ── Right: visual showcase ── */}
        <div className="relative min-h-[260px] overflow-hidden bg-linear-to-br from-[#eef3df] via-neutral-50 to-[#e8eef6] p-5 sm:min-h-[420px] sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand/15 blur-3xl" />

          <div className="relative grid h-full grid-cols-2 grid-rows-2 gap-3">
            {pics[0] && <HeroPic product={pics[0]} className="row-span-2" sizes="(max-width:1024px) 50vw, 25vw" tag="Trending" />}
            {pics[1] && <HeroPic product={pics[1]} sizes="(max-width:1024px) 50vw, 18vw" />}
            {pics[2] && <HeroPic product={pics[2]} sizes="(max-width:1024px) 50vw, 18vw" />}
          </div>

          {/* Floating accent chip */}
          <div className="absolute bottom-9 left-3 hidden items-center gap-2 rounded-2xl bg-white/90 px-3.5 py-2.5 shadow-lg backdrop-blur sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white">
              %
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-neutral-900">Daily deals</p>
              <p className="text-[11px] text-neutral-500">Up to 60% off</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroPic({
  product,
  className = "",
  sizes,
  tag,
}: {
  product: ProductCardData;
  className?: string;
  sizes: string;
  tag?: string;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group relative overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5 ${className}`}
    >
      {product.imageUrl && (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes={sizes}
        />
      )}
      {tag && (
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-900 backdrop-blur">
          {tag}
        </span>
      )}
      <span className="absolute bottom-2 left-2 rounded-lg bg-neutral-900/85 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
        {formatCurrency(product.price, product.currency)}
      </span>
    </Link>
  );
}
