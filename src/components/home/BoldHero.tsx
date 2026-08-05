import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

const POPULAR_SEARCHES = [
  { label: "Electronics", href: "/products?category=electronics" },
  { label: "Home & living", href: "/products?category=home" },
  { label: "Fashion", href: "/products?category=fashion" },
] as const;

/** Primary storefront campaign hero. Uses real retail photography and live navigation. */
export function BoldHero() {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-[#f3d8da] bg-[#fff6f6]">
      <div className="grid grid-cols-1 lg:min-h-[520px] lg:grid-cols-[1.04fr_0.96fr]">
        <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-11 lg:px-14 lg:py-12 xl:px-16">
          <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-brand shadow-sm ring-1 ring-brand/10">
            The store for almost anything
          </span>

          <h1 className="mt-6 max-w-2xl text-[3rem] font-extrabold leading-[0.96] tracking-[-0.055em] text-neutral-950 sm:text-6xl lg:text-[4.25rem]">
            Find more.
            <br />
            <span className="text-brand">Shop smarter.</span>
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-neutral-600 sm:text-lg">
            Thousands of products across tech, home, fashion and more—all with a
            clear price and delivery to your door.
          </p>

          <form action="/products" className="mt-8 max-w-xl">
            <div className="flex items-center rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_14px_35px_rgba(130,20,28,0.10)] focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
              <Search className="ml-3 h-5 w-5 shrink-0 text-neutral-400" />
              <input
                name="q"
                aria-label="Search products"
                placeholder="What are you shopping for?"
                className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
              />
              <button className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-[#c80511]">
                Search <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="mr-1 font-medium text-neutral-500">Popular:</span>
            {POPULAR_SEARCHES.map((item) => (
              <Link key={item.label} href={item.href} className="rounded-full border border-brand/10 bg-white/80 px-3 py-1.5 font-medium text-neutral-600 transition-colors hover:border-brand/30 hover:text-brand">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative min-h-[270px] overflow-hidden border-t border-[#f3d8da] sm:min-h-[320px] lg:min-h-0 lg:border-l lg:border-t-0">
          <Image
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=1200&fit=crop"
            alt="Shopping fashion and lifestyle products"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 48vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#fff6f6]/25 lg:via-transparent lg:to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl bg-white/92 px-4 py-3 shadow-lg backdrop-blur-sm sm:bottom-7 sm:left-7 sm:right-7">
            <div>
              <p className="text-xs font-semibold text-neutral-950">Fresh arrivals every week</p>
              <p className="mt-0.5 text-[11px] text-neutral-500">Explore what&apos;s new across every category</p>
            </div>
            <Link href="/products?sort=newest" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white transition-colors hover:bg-brand" aria-label="Browse new arrivals">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
