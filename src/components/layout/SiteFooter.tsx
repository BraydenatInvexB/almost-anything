import Link from "next/link";
import { LayoutGrid, Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import {
  FOOTER_NAV,
  FOOTER_LEGAL,
  FOOTER_SOCIALS,
  FOOTER_PAYMENTS,
} from "@/config/footer";
import { FooterNewsletter } from "@/components/layout/FooterNewsletter";

const TRUST = [
  { icon: Truck, title: "Free delivery", sub: "On orders over R1,000" },
  { icon: RotateCcw, title: "30-day returns", sub: "Hassle-free refunds" },
  { icon: ShieldCheck, title: "Secure checkout", sub: "Encrypted payments" },
  { icon: Headphones, title: "24/7 support", sub: "We're here to help" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t-[3px] border-black bg-white text-black">
      {/* ── Trust strip ── */}
      <div className="border-b-[3px] border-black bg-[#CDFF00]">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-4 px-6 py-7 sm:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3 px-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white">
                <t.icon className="h-5 w-5 text-black" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold uppercase text-black">{t.title}</p>
                <p className="truncate text-xs font-medium text-black/70">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-[1400px] px-6 pt-14 pb-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand block */}
          <div className="lg:col-span-4 xl:col-span-3">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-[#CDFF00]">
                <LayoutGrid className="h-4 w-4 text-black" />
              </div>
              <span className="text-base font-black uppercase tracking-tight text-black">
                {SITE_CONFIG.name}
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm font-medium leading-relaxed text-neutral-600">
              {SITE_CONFIG.tagline} Thousands of products across every category,
              fair prices, and fast delivery, all in one store.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {FOOTER_SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#CDFF00]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                    aria-hidden
                    dangerouslySetInnerHTML={{ __html: social.svg }}
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5 xl:col-span-6">
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-xs font-extrabold uppercase tracking-widest text-black">
                  {col.title}
                </p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("mailto:") ? (
                        <a
                          href={link.href}
                          className="text-sm font-medium text-neutral-600 transition-colors hover:text-black hover:underline"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm font-medium text-neutral-600 transition-colors hover:text-black hover:underline"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-3 xl:col-span-3">
            <p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-black">
              Stay in the loop
            </p>
            <p className="mt-3 text-base font-black uppercase text-black">
              Deals before they go live
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-600">
              New arrivals and deals land daily. Be the first to know.
            </p>
            <div className="mt-5">
              <FooterNewsletter />
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t-[3px] border-black bg-black text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <p className="order-3 text-xs font-medium text-white/70 lg:order-1">
            © {year} {SITE_CONFIG.name}. All rights reserved.
          </p>

          <nav className="order-1 flex flex-wrap items-center gap-x-6 gap-y-2 lg:order-2">
            {FOOTER_LEGAL.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-bold uppercase tracking-wide text-white/80 transition-colors hover:text-[#CDFF00]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="order-2 flex flex-wrap items-center gap-2 lg:order-3">
            {FOOTER_PAYMENTS.map((p) => (
              <span
                key={p}
                className="rounded-md border-2 border-white/30 bg-white/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
