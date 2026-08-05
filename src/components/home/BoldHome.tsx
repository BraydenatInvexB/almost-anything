import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ProductCardData } from "@/types";
import { STOREFRONT_SECTION_BY_ID } from "@/config/storefront-sections";
import { HomeProductRail } from "@/components/home/HomeProductRail";
import { HomeShopSidebar } from "@/components/home/HomeShopSidebar";
import { HomeMarketplaceHeader } from "@/components/home/HomeMarketplaceHeader";
import { HomeBentoHero } from "@/components/home/HomeBentoHero";

interface BoldHomeProps {
  hot: ProductCardData[];
  steals: ProductCardData[];
  fresh: ProductCardData[];
}

export function BoldHome({ hot, steals, fresh }: BoldHomeProps) {
  const hotSection = STOREFRONT_SECTION_BY_ID.hot;
  const stealsSection = STOREFRONT_SECTION_BY_ID.steals;
  const freshSection = STOREFRONT_SECTION_BY_ID.fresh;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_24px_70px_rgba(80,20,28,0.10)]">
      <div className="home-marketplace-grid">
      <HomeShopSidebar />
      <div className="min-w-0 bg-white">
        <HomeMarketplaceHeader />
        <div className="flex min-w-0 flex-col gap-10 p-4 sm:p-6 lg:p-8">
        <HomeBentoHero />

        {steals.length ? (
        <section className="flex flex-col gap-5">
          <SectionHead
            title="Trending deals"
            subtitle="Grab them before they're gone."
            href={stealsSection.shopHref}
            cta="View all deals"
          />
          <HomeProductRail products={steals} />
        </section>
        ) : null}

        {hot.length ? (
        <section className="flex flex-col gap-5">
          <SectionHead
            title={hotSection.title}
            href={hotSection.shopHref}
            cta={hotSection.shopCta}
          />
          <HomeProductRail products={hot} />
        </section>
        ) : null}

        {fresh.length ? (
        <section className="flex flex-col gap-5">
          <SectionHead
            title={freshSection.title}
            href={freshSection.shopHref}
            cta={freshSection.shopCta}
          />
          <HomeProductRail products={fresh} />
        </section>
        ) : null}
        </div>
      </div>
      </div>
    </div>
  );
}

function SectionHead({
  title,
  subtitle,
  href,
  cta,
}: {
  title: string;
  subtitle?: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {title}
          <ArrowRight className="h-5 w-5 text-brand" strokeWidth={2.5} />
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        ) : null}
      </div>
      <Link
        href={href}
        className="hidden shrink-0 items-center gap-1.5 rounded-full border border-brand/25 bg-white px-4 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand-soft sm:inline-flex"
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
