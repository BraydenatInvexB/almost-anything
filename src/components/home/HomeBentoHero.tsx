import Link from "next/link";
import { ArrowRight, Sparkles, Tag } from "lucide-react";

/** Typography-led marketplace hero. Product photography is reserved for catalogue rails. */
export function HomeBentoHero() {
  return (
    <section aria-label="Almost Anything marketplace" className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
      <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-brand p-8 text-white sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full border-[55px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 right-32 h-64 w-64 rounded-full bg-black/10" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">The store for almost anything</p>
          <h2 className="mt-6 max-w-2xl text-5xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl xl:text-7xl">
            Find what you need. Discover what&apos;s next.
          </h2>
        </div>
        <div className="relative mt-10 flex flex-wrap items-center gap-3">
          <Link href="/products" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-neutral-950 transition-transform hover:-translate-y-0.5">
            Explore products <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/products?deals=true" className="inline-flex h-12 items-center rounded-full border border-white/25 px-5 text-sm font-semibold text-white hover:bg-white/10">
            Shop deals
          </Link>
        </div>
      </div>

      <div className="grid min-h-[420px] gap-4 sm:grid-cols-2 lg:grid-cols-1">
        <PromoTile
          eyebrow="Just added"
          title="New this week"
          body="See the latest products across the store."
          href="/products?sort=newest"
          cta="Shop new"
          icon={Sparkles}
          tone="yellow"
        />
        <PromoTile
          eyebrow="Worth a look"
          title="Today’s deals"
          body="Limited-time prices, all in one place."
          href="/products?deals=true"
          cta="View deals"
          icon={Tag}
          tone="red"
        />
      </div>
    </section>
  );
}

function PromoTile({
  eyebrow,
  title,
  body,
  href,
  cta,
  icon: Icon,
  tone,
}: {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  icon: typeof Sparkles;
  tone: "yellow" | "red";
}) {
  const isRed = tone === "red";

  return (
    <article className={`relative flex min-h-[202px] flex-col justify-between overflow-hidden rounded-[1.75rem] p-6 ${isRed ? "bg-[#a92d35] text-white" : "bg-[#f4e7b8] text-neutral-950"}`}>
      <span className={`absolute -right-10 -top-10 h-36 w-36 rounded-full border-[24px] ${isRed ? "border-white/[0.07]" : "border-white/35"}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${isRed ? "text-white/60" : "text-neutral-500"}`}>{eyebrow}</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">{title}</h3>
          <p className={`mt-2 max-w-[16rem] text-xs leading-5 ${isRed ? "text-white/70" : "text-neutral-600"}`}>{body}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isRed ? "bg-white/12 text-white" : "bg-white/60 text-[#a92d35]"}`}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
      </div>
      <Link href={href} className={`relative mt-5 inline-flex w-fit items-center gap-2 text-xs font-semibold ${isRed ? "text-white" : "text-neutral-900"}`}>
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}
