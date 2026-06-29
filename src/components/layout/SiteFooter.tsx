import Link from "next/link";
import type { ReactNode } from "react";
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
  { icon: RotateCcw, title: "30 day returns", sub: "Hassle-free refunds" },
  { icon: ShieldCheck, title: "Secure checkout", sub: "Encrypted payments" },
  { icon: Headphones, title: "Dedicated support", sub: "help@almostanything.co.za" },
];

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className =
    "text-sm leading-relaxed text-neutral-600 transition-colors hover:text-neutral-950";

  if (external || href.startsWith("mailto:")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

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
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.16 2.25h6.977l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  const topCategories = FOOTER_CATEGORIES.slice(0, 6);

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white text-neutral-900">
      {/* Trust strip */}
      <div className="border-b border-neutral-200 bg-neutral-950 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                <t.icon className="h-4 w-4 text-brand" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-neutral-400">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-6 py-14 lg:py-16">
        {/* Link columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-12">
          {FOOTER_NAV.map((col) => (
            <FooterColumn key={col.title} title={col.title}>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink href={link.href} external={link.href.startsWith("mailto:")}>
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </FooterColumn>
          ))}

          <FooterColumn title="Categories">
            <ul className="space-y-3">
              {topCategories.map((cat) => (
                <li key={cat.href}>
                  <FooterLink href={cat.href}>{cat.label}</FooterLink>
                </li>
              ))}
            </ul>
            <Link
              href="/products"
              className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
            >
              Browse all categories
            </Link>
          </FooterColumn>

          <FooterColumn title="Terms & policies">
            <ul className="space-y-3">
              {FOOTER_POLICIES.map((link) => (
                <li key={link.href}>
                  <FooterLink href={link.href}>{link.label}</FooterLink>
                </li>
              ))}
            </ul>
          </FooterColumn>
        </div>

        {/* Brand + newsletter */}
        <div className="mt-12 flex flex-col gap-10 border-t border-neutral-200 pt-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <div className="max-w-md shrink-0">
            <SiteLogo variant="full" />
            <p className="mt-5 text-sm leading-relaxed text-neutral-600">
              {SITE_CONFIG.tagline} Thousands of quality products, fair prices, and fast delivery
              across South Africa.
            </p>
            <p className="mt-4">
              <FooterLink href={`mailto:${SITE_CONFIG.supportEmail}`} external>
                {SITE_CONFIG.supportEmail}
              </FooterLink>
            </p>
            {FOOTER_SOCIALS.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                {FOOTER_SOCIALS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
                  >
                    <SocialIcon label={social.label} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="w-full lg:max-w-md lg:pt-1">
            <h3 className="text-base font-semibold text-neutral-950">Stay in the loop</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Get new arrivals, member deals, and exclusive offers. Unsubscribe anytime.
            </p>
            <div className="mt-5">
              <FooterNewsletter />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-neutral-500">
            © {year} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {FOOTER_PAYMENTS.map((p) => (
              <span
                key={p}
                className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-neutral-500"
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
