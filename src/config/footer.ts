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

/** Accepted payment methods, shown with local brand assets for trust. */
export const FOOTER_PAYMENTS = [
  { label: "Visa", logo: "/assets/payment-logos/visa.svg" },
  { label: "Mastercard", logo: "/assets/payment-logos/mastercard.svg" },
  {
    label: "American Express",
    logo: "/assets/payment-logos/american-express-blue-box.svg",
  },
  { label: "Apple Pay", logo: "/assets/payment-logos/apple-pay.svg" },
  { label: "Google Pay", logo: "/assets/payment-logos/google-pay.svg" },
  { label: "PayFast", logo: "/assets/payment-logos/payfast.svg" },
  { label: "Ozow", logo: "/assets/payment-logos/ozow.png" },
] as const;

export const FOOTER_SOCIALS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/almostanythingofficial",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@almostanythingofficial",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/share/19Aw5ptAAL/?mibextid=wwXIfr&wa_status_inline=true",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/almostanythingofficial/?lipi=urn%3Ali%3Apage%3Ad_flagship3_search_srp_companies%3BVQHSA1JCQiq%2BggdyYD%2FFhg%3D%3D",
  },
] as const;
