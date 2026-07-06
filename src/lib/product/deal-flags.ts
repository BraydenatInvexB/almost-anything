import type { StorefrontSectionFlags } from "@/config/storefront-sections";

type DealProductLike = {
  is_deal?: boolean;
  deal_discount_percent?: number | null;
};

/** Keep Today's Deals page (`is_deal`) in sync with homepage steals toggles. */
export function storefrontSectionPatch(
  product: DealProductLike,
  sections: StorefrontSectionFlags,
): StorefrontSectionFlags & { is_deal?: boolean } {
  const patch: StorefrontSectionFlags & { is_deal?: boolean } = { ...sections };

  if (sections.show_in_steals) {
    patch.is_deal = true;
  } else if (!product.deal_discount_percent) {
    patch.is_deal = false;
  }

  return patch;
}

export function resolveProductIsDeal(
  specialEnabled: boolean,
  sections: Pick<StorefrontSectionFlags, "show_in_steals">,
): boolean {
  return specialEnabled || sections.show_in_steals;
}
