import Link from "next/link";
import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { SiteLogo } from "@/components/layout/SiteLogo";
import {
  FOOTER_NAV,
  FOOTER_POLICIES,
  FOOTER_SOCIALS,
  FOOTER_PAYMENTS,
  FOOTER_CATEGORIES,
} from "@/config/footer";
import { FooterNewsletter } from "@/components/layout/FooterNewsletter";

const TRUST = [
  { icon: Truck, title: "Free delivery", sub: "On orders over R1,000" },
  { icon: RotateCcw, title: "30 day returns", sub: "Hassle free refunds" },
  { icon: ShieldCheck, title: "Secure checkout", sub: "Encrypted payments" },
  { icon: Headphones, title: "24/7 support", sub: "We're here to help" },
];

function SocialIcon({ label }: { label: string }) {
  if (label.includes("Instagram")) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (label.includes("LinkedIn")) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    );
  }
  if (label.includes("TikTok")) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2" aria-hidden>
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.16 2.25h6.977l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const categories = FOOTER_CATEGORIES.slice(0, 8);

  return (
    <footer className="mt-auto border-t-[3px] border-black bg-white text-black">
      {/* Trust strip */}
      <div className="border-b-[3px] border-black bg-brand text-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4 lg:py-7">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-white/30 bg-white/10">
                <t.icon className="h-5 w-5 text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold uppercase">{t.title}</p>
                <p className="text-xs font-medium text-white/80">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-[1400px] px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-3">
            <SiteLogo variant="full" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-600">
              {SITE_CONFIG.tagline} Thousands of products, fair prices, fast delivery, all in one store.
            </p>
            <p className="mt-4 text-sm text-neutral-600">
              <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="font-semibold text-brand hover:underline">
                {SITE_CONFIG.supportEmail}
              </a>
            </p>
            <div className="mt-5 flex items-center gap-2">
              {FOOTER_SOCIALS.length > 0 &&
                FOOTER_SOCIALS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white text-black shadow-[2px_2px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand hover:text-white"
                  >
                    <SocialIcon label={social.label} />
                  </a>
                ))}
            </div>
            <div className="mt-8 border-t border-neutral-200 pt-8 lg:mt-10">
              <p className="text-xs font-extrabold uppercase tracking-widest">Stay in the loop</p>
              <p className="mt-2 text-base font-black uppercase leading-tight">Deals before they go live</p>
              <p className="mt-1 text-sm text-neutral-600">New arrivals and deals. No spam.</p>
              <div className="mt-4">
                <FooterNewsletter />
              </div>
            </div>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            {FOOTER_NAV.map((col) => (
              <div key={col.title}>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-widest">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("mailto:") ? (
                        <a href={link.href} className="text-sm font-medium text-neutral-600 hover:text-brand hover:underline">
                          {link.label}
                        </a>
                      ) : (
                        <Link href={link.href} className="text-sm font-medium text-neutral-600 hover:text-brand hover:underline">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div className="lg:col-span-2">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest">Categories</p>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.href}>
                  <Link href={cat.href} className="text-sm font-medium text-neutral-600 hover:text-brand hover:underline">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/products" className="mt-3 inline-block text-sm font-bold text-brand hover:underline">
              View all →
            </Link>
          </div>

          {/* Terms and Policies */}
          <div className="lg:col-span-2">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-widest">Terms and Policies</p>
            <ul className="space-y-2.5">
              {FOOTER_POLICIES.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-neutral-600 hover:text-brand hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t-[3px] border-black bg-black text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-white/70">
            © {year} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {FOOTER_PAYMENTS.map((p) => (
              <span key={p} className="rounded border border-white/25 bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-white/80">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
