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
  {
    title: "Legal",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Shipping Policy", href: "/help/shipping" },
      { label: "Returns Policy", href: "/help/returns" },
      { label: "Contact Us", href: `mailto:${SITE_CONFIG.supportEmail}` },
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

export const FOOTER_SOCIALS: readonly { label: string; href: string; svg?: string }[] = [];
