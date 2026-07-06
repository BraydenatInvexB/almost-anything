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
  if (label.includes("TikTok")) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.77 1.52V6.76a4.85 4.85 0 0 1-1-.07z" />
      </svg>
    );
  }
  if (label.includes("Facebook")) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (label.includes("LinkedIn")) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    );
  }
  return null;
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
