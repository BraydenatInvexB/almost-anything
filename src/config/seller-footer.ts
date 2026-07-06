/** Footer links for the seller marketplace — keep seller-facing nav separate from shopper nav. */

export interface FooterSellerLink {
  label: string;
  href: string;
}

export const FOOTER_SELLER_TITLE = "Sell with us";

export const FOOTER_SELLER_LINKS: readonly FooterSellerLink[] = [
  { label: "Why sell with us", href: "/sell" },
  { label: "Start selling", href: "/sell/register" },
  { label: "Seller sign in", href: "/login?redirect=/seller" },
  { label: "Browse businesses", href: "/businesses" },
  { label: "Pricing & plans", href: "/sell#pricing" },
];
