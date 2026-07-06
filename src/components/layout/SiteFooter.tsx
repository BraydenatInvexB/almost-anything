import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_CONFIG } from "@/config/site";
import { SiteLogo } from "@/components/layout/SiteLogo";
import {
  FOOTER_NAV,
  FOOTER_SOCIALS,
  FOOTER_PAYMENTS,
  FOOTER_CATEGORIES,
} from "@/config/footer";
import { FOOTER_SELLER_LINKS, FOOTER_SELLER_TITLE } from "@/config/seller-footer";
import { FooterNewsletter } from "@/components/layout/FooterNewsletter";

const FOOTER_TITLE_CLASS =
  "min-h-11 text-sm font-semibold leading-snug tracking-wide text-brand";
const FOOTER_LINK_CLASS =
  "block text-sm leading-5 text-neutral-600 transition-colors hover:text-neutral-900";
const FOOTER_LINK_HIGHLIGHT_CLASS =
  "block text-sm font-medium leading-5 text-brand transition-colors hover:text-brand/80";

export interface FooterLinkItem {
  label: string;
  href: string;
  highlight?: boolean;
}

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col items-start">
      <h3 className={FOOTER_TITLE_CLASS}>{title}</h3>
      <div className="mt-4 w-full">{children}</div>
    </div>
  );
}

function FooterLink({
  href,
  children,
  external,
  highlight,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  highlight?: boolean;
}) {
  const className = highlight ? FOOTER_LINK_HIGHLIGHT_CLASS : FOOTER_LINK_CLASS;

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

function FooterLinkList({ links }: { links: readonly FooterLinkItem[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {links.map((link) => (
        <li key={link.label} className="min-h-5">
          <FooterLink
            href={link.href}
            external={link.href.startsWith("mailto:")}
            highlight={link.highlight}
          >
            {link.label}
          </FooterLink>
        </li>
      ))}
    </ul>
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
  const categoryLinks: FooterLinkItem[] = [
    ...FOOTER_CATEGORIES.slice(0, 5).map((cat) => ({ label: cat.label, href: cat.href })),
    { label: "All categories", href: "/categories", highlight: true },
  ];

  return (
    <footer className="mt-auto border-t border-neutral-200 bg-white text-neutral-900">
      <div className="mx-auto max-w-[1400px] px-8 py-14 lg:px-12 lg:py-16">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-start lg:gap-16 xl:gap-20">
          <div className="w-full shrink-0 lg:w-64 xl:w-72">
            <SiteLogo variant="full" />
            <p className="mt-10 text-sm font-semibold text-neutral-900">Contact</p>
            <a
              href={`mailto:${SITE_CONFIG.supportEmail}`}
              className="mt-2 block text-sm leading-5 text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {SITE_CONFIG.supportEmail}
            </a>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              {SITE_CONFIG.tagline}
            </p>
            {FOOTER_SOCIALS.length > 0 && (
              <div className="mt-6 flex items-center gap-2.5">
                {FOOTER_SOCIALS.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand/90"
                  >
                    <SocialIcon label={social.label} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-12">
            <div className="grid grid-cols-2 items-start gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 xl:gap-x-10 xl:gap-y-0">
              {FOOTER_NAV.map((col) => (
                <FooterColumn key={col.title} title={col.title}>
                  <FooterLinkList links={col.links} />
                </FooterColumn>
              ))}

              <FooterColumn title={FOOTER_SELLER_TITLE}>
                <FooterLinkList links={FOOTER_SELLER_LINKS} />
              </FooterColumn>

              <FooterColumn title="Categories">
                <FooterLinkList links={categoryLinks} />
              </FooterColumn>
            </div>

            <div className="max-w-xl border-t border-neutral-100 pt-10">
              <p className={FOOTER_TITLE_CLASS}>Stay in the loop</p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                New arrivals, member deals, and exclusive offers.
              </p>
              <div className="mt-5">
                <FooterNewsletter />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200">
        <div className="mx-auto max-w-[1400px] px-8 py-7 lg:px-12">
          <div className="flex flex-col items-center gap-5 text-center lg:flex-row lg:justify-between lg:text-left">
            <p className="text-xs text-neutral-500">
              © {year} {SITE_CONFIG.name}. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {FOOTER_PAYMENTS.map((p) => (
                <span
                  key={p}
                  className="rounded border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-500"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
