export type StorefrontSectionId = "hot" | "steals" | "fresh";

export interface StorefrontSection {
  id: StorefrontSectionId;
  /** Database column on `products` */
  column: "show_in_hot" | "show_in_steals" | "show_in_fresh_drops";
  title: string;
  kicker: string;
  shortLabel: string;
  shopHref: string;
  shopCta: string;
}

export const STOREFRONT_SECTIONS: StorefrontSection[] = [
  {
    id: "hot",
    column: "show_in_hot",
    title: "Hot right now",
    kicker: "Flying off the shelf",
    shortLabel: "Hot",
    shopHref: "/products?section=hot",
    shopCta: "Shop all",
  },
  {
    id: "steals",
    column: "show_in_steals",
    title: "Today's Deals",
    kicker: "Limited-time offers",
    shortLabel: "Deals",
    shopHref: "/products?deals=true",
    shopCta: "All deals",
  },
  {
    id: "fresh",
    column: "show_in_fresh_drops",
    title: "Fresh drops",
    kicker: "Just landed",
    shortLabel: "Fresh",
    shopHref: "/products?section=fresh",
    shopCta: "Browse",
  },
];

export const STOREFRONT_SECTION_BY_ID = Object.fromEntries(
  STOREFRONT_SECTIONS.map((s) => [s.id, s]),
) as Record<StorefrontSectionId, StorefrontSection>;

export type StorefrontSectionFlags = {
  show_in_hot: boolean;
  show_in_steals: boolean;
  show_in_fresh_drops: boolean;
};

export const DEFAULT_SECTION_FLAGS: StorefrontSectionFlags = {
  show_in_hot: false,
  show_in_steals: false,
  show_in_fresh_drops: false,
};

export function sectionFlagsFromProduct(product: Partial<StorefrontSectionFlags>): StorefrontSectionFlags {
  return {
    show_in_hot: Boolean(product.show_in_hot),
    show_in_steals: Boolean(product.show_in_steals),
    show_in_fresh_drops: Boolean(product.show_in_fresh_drops),
  };
}
