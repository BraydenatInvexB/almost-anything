import { SITE_CONFIG } from "@/config/site";
import { STORE_CATEGORIES } from "@/config/categories";

export const FOOTER_NAV = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Today's Deals", href: "/products?deals=true" },
      { label: "New Arrivals", href: "/products?sort=newest" },
      { label: "Favorites", href: "/favorites" },
      { label: "Your Cart", href: "/cart" },
    ],
  },
  {
    title: "Customer Service",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Shipping Info", href: "/help/shipping" },
      { label: "Returns & Refunds", href: "/help/returns" },
      { label: "Track My Order", href: "/track" },
      { label: "Contact Us", href: `mailto:${SITE_CONFIG.supportEmail}` },
    ],
  },
  {
    title: "My Account",
    links: [
      { label: "Sign In", href: "/login" },
      { label: "Create Account", href: "/signup" },
      { label: "Order History", href: "/account/orders" },
      { label: "My Favorites", href: "/favorites" },
      { label: "Request a Product", href: "/request" },
    ],
  },
] as const;

/** Full category list for the footer "Shop by category" section. */
export const FOOTER_CATEGORIES = STORE_CATEGORIES.map((c) => ({
  label: c.label,
  href: `/products?category=${c.slug}`,
}));

/** Accepted payment methods, shown as badges for trust. */
export const FOOTER_PAYMENTS = [
  "Visa",
  "Mastercard",
  "Amex",
  "PayPal",
  "Apple Pay",
  "Google Pay",
] as const;

export const FOOTER_LEGAL = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Help", href: "/help" },
] as const;

export const FOOTER_SOCIALS = [
  {
    label: "Twitter / X",
    href: "https://twitter.com",
    svg: `<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.16 2.25h6.977l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>`,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    svg: `<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>`,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    svg: `<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>`,
  },
  {
    label: "TikTok",
    href: "https://tiktok.com",
    svg: `<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>`,
  },
] as const;
