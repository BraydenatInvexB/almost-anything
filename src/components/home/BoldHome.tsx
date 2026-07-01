import Link from "next/link";
import { ArrowRight, ArrowUpRight, Search, Tag, Truck } from "lucide-react";
import type { ProductCardData } from "@/types";
import { STORE_CATEGORIES } from "@/config/categories";
import type { HeroShowcaseConfig } from "@/lib/admin/operations-types";
import { STOREFRONT_SECTION_BY_ID } from "@/config/storefront-sections";
import { BoldHero } from "@/components/home/BoldHero";
import { HomeProductRail } from "@/components/home/HomeProductRail";

const POP = ["#e30613", "#5BC8FF", "#e30613", "#C7A8FF", "#e30613", "#7DE2A8", "#e30613", "#9BE7FF"];

interface BoldHomeProps {
  hot: ProductCardData[];
  steals: ProductCardData[];
  fresh: ProductCardData[];
  heroShowcase: HeroShowcaseConfig;
}

export function BoldHome({ hot, steals, fresh, heroShowcase }: BoldHomeProps) {
  const cats = STORE_CATEGORIES.slice(0, 8);
  const hotSection = STOREFRONT_SECTION_BY_ID.hot;
  const stealsSection = STOREFRONT_SECTION_BY_ID.steals;
  const freshSection = STOREFRONT_SECTION_BY_ID.fresh;

  return (
    <div className="mt-4 flex flex-col gap-8 sm:gap-10">
      <BoldHero showcase={heroShowcase} />

      <BrandMarquee />

      {/* Categories */}
      <SectionHead kicker="Pick a lane" title="Shop by category" href="/products" cta="See everything" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cats.map((c, i) => (
          <Link
            key={c.slug}
            href={`/products?category=${c.slug}`}
            className="group flex min-h-[140px] flex-col justify-between rounded-[22px] border-[3px] border-black p-5 shadow-[5px_5px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_#000]"
            style={{ backgroundColor: POP[i % POP.length] }}
          >
            <span className="flex h-9 w-9 items-center justify-center self-end rounded-full border-2 border-black bg-white transition-transform group-hover:rotate-45">
              <ArrowUpRight className="h-4 w-4 text-black" />
            </span>
            <span className="text-xl font-black uppercase leading-tight tracking-tight text-black sm:text-2xl">
              {c.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Hot right now */}
      {hot.length ? (
        <>
          <SectionHead
            kicker={hotSection.kicker}
            title={hotSection.title}
            href={hotSection.shopHref}
            cta={hotSection.shopCta}
          />
          <HomeProductRail products={hot} />
        </>
      ) : null}

      {/* Today's steals */}
      {steals.length ? (
        <>
          <SectionHead
            kicker={stealsSection.kicker}
            title={stealsSection.title}
            href={stealsSection.shopHref}
            cta={stealsSection.shopCta}
          />
          <HomeProductRail products={steals} />
        </>
      ) : null}

      {/* Fresh drops */}
      {fresh.length ? (
        <>
          <SectionHead
            kicker={freshSection.kicker}
            title={freshSection.title}
            href={freshSection.shopHref}
            cta={freshSection.shopCta}
          />
          <HomeProductRail products={fresh} />
        </>
      ) : null}

      {/* How it works — after product discovery */}
      <HowItWorksBold />

      <BoldCTA />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

function BrandMarquee() {
  const words = ["Almost anything", "Delivered to your door", "One simple price", "If you can name it"];
  const strip = [...words, ...words, ...words];
  return (
    <div className="overflow-hidden rounded-2xl border-[3px] border-black bg-black py-3">
      <div className="animate-marquee flex w-max items-center gap-6 whitespace-nowrap">
        {strip.map((w, i) => (
          <span key={i} className="flex items-center gap-6 text-lg font-black uppercase tracking-tight text-brand sm:text-2xl">
            {w}
            <span className="text-white">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionHead({
  kicker,
  title,
  href,
  cta,
}: {
  kicker: string;
  title: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-neutral-500">
          {kicker}
        </span>
        <h2 className="text-3xl font-black uppercase tracking-tight text-black sm:text-4xl">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="hidden shrink-0 items-center gap-1.5 rounded-full border-[3px] border-black bg-white px-4 py-2 text-xs font-extrabold uppercase shadow-[3px_3px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand hover:text-white hover:shadow-[5px_5px_0_0_#000] sm:inline-flex"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function HowItWorksBold() {
  const steps = [
    { n: "01", icon: Search, title: "Search anything", body: "From everyday bits to the hard to find. If you can name it, it's here.", bg: "#5BC8FF" },
    { n: "02", icon: Tag, title: "One honest price", body: "No comparing tabs. One clear price with delivery sorted.", bg: "#FFD23F" },
    { n: "03", icon: Truck, title: "We bring it", body: "Pay securely and relax. Track it all the way to your door.", bg: "#e30613" },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {steps.map((s) => (
        <div
          key={s.n}
          className="rounded-[22px] border-[3px] border-black p-6 shadow-[5px_5px_0_0_#000]"
          style={{ backgroundColor: s.bg }}
        >
          <div className="flex items-center justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-white">
              <s.icon className="h-5 w-5 text-black" />
            </span>
            <span className="text-4xl font-black text-black/80">{s.n}</span>
          </div>
          <h3 className="mt-4 text-xl font-black uppercase text-black">{s.title}</h3>
          <p className="mt-1.5 text-sm font-medium text-black/80">{s.body}</p>
        </div>
      ))}
    </div>
  );
}

function BoldCTA() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border-[3px] border-black bg-brand px-6 py-12 text-white shadow-[7px_7px_0_0_#000] sm:px-12">
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="max-w-xl text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
            Can&apos;t find it?
            <br />
            Just ask.
          </h3>
          <p className="mt-4 max-w-md text-base font-semibold text-white/85">
            Tell us exactly what you want. We&apos;ve probably got it, and we&apos;ll
            land it on your doorstep at one simple price.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3">
          <Link
            href="/request"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-[3px] border-black bg-black px-7 py-3.5 text-sm font-extrabold uppercase text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5"
          >
            Tell us what you want
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/products"
            className="text-center text-xs font-extrabold uppercase text-white/80 underline underline-offset-4 hover:text-white"
          >
            Or browse the store
          </Link>
        </div>
      </div>
    </section>
  );
}
