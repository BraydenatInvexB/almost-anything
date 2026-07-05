import {
  AGGREGATOR_PATH,
  ACCESSORY_INTENT_TERMS,
  ACCESSORY_LINE,
  NON_PRODUCT_SNIPPET,
  NON_PRODUCT_TITLE,
  SPECIFIC_INTL_PRODUCT,
} from "@/lib/sourcing/wholesale-listing-patterns";
import { isSaApparelWholesaleDomain } from "@/lib/sourcing/wholesale-supplier-constants";
import { resolveRedirectUrl } from "@/lib/sourcing/wholesale-supplier-url";

/** Parts / accessories when the shopper searched for a DEVICE, not an accessory. */
export function isAccessoryListing(query: string, title: string, snippet = ""): boolean {
  if (ACCESSORY_INTENT_TERMS.test(query)) return false;

  if (!/\b(ipad|iphone|apple\s*watch|macbook|galaxy\s*tab|tablet|smartphone|phone)\b/i.test(query)) {
    return false;
  }
  const blob = `${title} ${snippet}`.toLowerCase();
  if (!ACCESSORY_LINE.test(blob)) return false;
  if (/\b(complete\s*tablet|used\s+pad|tablet\s*pc|whole\s*unit|full\s*device)\b/i.test(blob)) return false;
  if (/\b(used|refurbished|second[\s-]?hand)\b/i.test(blob) && /\b(tablet|ipad)\b/i.test(blob)) return false;
  return true;
}

/** Alibaba/MIC search titles that name a concrete SKU, not a showroom index. */
export function isSpecificIntlProductTitle(title: string, snippet = ""): boolean {
  const t = title.trim();
  if (!t || t.length < 18 || NON_PRODUCT_TITLE.test(t)) return false;
  if (/\b(shop\s+all|view\s+all|supplier\s+directory|browse\s+our|shop\s+sleepwear)\b/i.test(t)) {
    return false;
  }
  return SPECIFIC_INTL_PRODUCT.test(`${t} ${snippet}`);
}

/** B2B catalogue / service pages — not a single purchasable SKU. */
export function isNonProductListing(title: string, url: string, snippet = ""): boolean {
  const t = title.trim();
  const blob = `${t} ${snippet}`.toLowerCase();
  if (NON_PRODUCT_TITLE.test(t) || NON_PRODUCT_TITLE.test(snippet)) return true;
  if (NON_PRODUCT_SNIPPET.test(blob)) return true;

  try {
    const { pathname, hostname } = new URL(resolveRedirectUrl(url));
    const path = pathname.toLowerCase();
    const host = hostname.toLowerCase();
    const saApparelWholesale = isSaApparelWholesaleDomain(host);
    const specificIntl = isSpecificIntlProductTitle(t, snippet);
    if (AGGREGATOR_PATH.test(path)) {
      if (
        !(specificIntl && (hostname.includes("alibaba.com") || hostname.includes("made-in-china.com")))
      ) {
        return true;
      }
    }
    if (hostname.includes("alibaba.com") && !/\/product-detail\//i.test(path)) {
      const hasUnitPrice = /\$\s*[\d,]+(?:\.\d{1,2})?/.test(snippet);
      const specificLine =
        snippet.length > 40 && !NON_PRODUCT_TITLE.test(title) && !NON_PRODUCT_TITLE.test(snippet);
      if (hasUnitPrice && specificLine) return false;
      if (specificIntl) return false;
      return true;
    }
    if (hostname.includes("made-in-china.com") && !/\/product\/|\/multi-search\//i.test(path)) {
      if (/\/showroom\/|\/company-|\/catalog\//i.test(path)) return true;
    }
    if (/\/(trade-in|tradein|sell-back|buyback)\b/i.test(path)) return true;
    if (/\/shop\/?$|\/store\/?$|\/all-products/i.test(path)) return true;
    if (/\/product-category\//i.test(path)) {
      if (saApparelWholesale && /sleepwear|nightgown|nightie|pajama|pyjama|lingerie|underwear|apparel/i.test(path)) {
        return false;
      }
      return true;
    }
    if (/\/pages\/.*bulk|bulk[\s-]?pricing/i.test(path)) return true;
    if (/\b(bulk|wholesale)[\s-]?(pricing|prices)\b/i.test(t)) return true;
  } catch {
    return true;
  }

  return false;
}
