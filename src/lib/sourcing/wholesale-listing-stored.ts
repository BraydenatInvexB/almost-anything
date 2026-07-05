import { containsSearchSnippetJunk } from "@/lib/sourcing/listing-copy-sanitizer";
import { AGGREGATOR_PATH } from "@/lib/sourcing/wholesale-listing-patterns";
import { isPlausibleWholesalePrice } from "@/lib/sourcing/wholesale-listing-pricing";
import {
  isCatalogPageTitle,
  isSupplierBrandedCatalogTitle,
  productNameMatchesQuery,
} from "@/lib/sourcing/wholesale-listing-titles";
import { isNonProductListing } from "@/lib/sourcing/wholesale-listing-non-product";
import { WHOLESALE_DOMAINS } from "@/lib/sourcing/wholesale-supplier-constants";
import {
  domainFromUrl,
  isJunkProductTitle,
  isRetailPriceSource,
  resolveRedirectUrl,
} from "@/lib/sourcing/wholesale-supplier-url";

export function isWholesaleProductDetailUrl(url: string): boolean {
  try {
    const { pathname, hostname } = new URL(resolveRedirectUrl(url));
    const host = hostname.toLowerCase();
    const path = pathname.toLowerCase();

    if (host.includes("alibaba.com")) return /\/product-detail\//i.test(path);
    if (host.includes("1688.com")) return /\/offer\//i.test(path);
    if (host.includes("made-in-china.com")) return /\/product\/[^/]+\/[a-z0-9-]+\.html/i.test(path);
    if (host.includes("dhgate.com")) return /\/product\//i.test(path);
    if (host.includes("globalsources.com")) return /\/product\//i.test(path);
    if (WHOLESALE_DOMAINS.some((d) => host.includes(d))) return !AGGREGATOR_PATH.test(path);
    return false;
  } catch {
    return false;
  }
}

export function isBadStoredDiscoveryProduct(input: {
  name: string;
  description: string;
  sourceUrl: string;
  retailPrice: number;
  query: string;
}): boolean {
  if (!Number.isFinite(input.retailPrice) || input.retailPrice <= 0) return true;
  if (isJunkProductTitle(input.name)) return true;
  if (isCatalogPageTitle(input.name)) return true;
  if (isSupplierBrandedCatalogTitle(input.name, domainFromUrl(input.sourceUrl))) return true;
  if (containsSearchSnippetJunk(input.description)) return true;
  if (!productNameMatchesQuery(input.query, input.name)) return true;
  if (isNonProductListing(input.name, input.sourceUrl, input.description)) return true;
  const domain = domainFromUrl(input.sourceUrl);
  if (domain && isRetailPriceSource(domain)) return true;
  if (domain && /digicape|takealot|makro|incredible|istore|hificorp/i.test(domain)) return true;
  if (/\bshop[\s-]?online\s+for\b/i.test(input.name)) return true;
  if (/shop-online-for|sleep-collective|sleepcollective/i.test(input.sourceUrl)) return true;
  if (
    /\blocally handmade\b/i.test(`${input.name} ${input.description}`) &&
    !/made-in-china|alibaba|globalsources|1688\.com/i.test(input.sourceUrl)
  ) {
    return true;
  }
  if (!isPlausibleWholesalePrice(input.query, input.retailPrice * 0.9)) return true;
  return false;
}

export function isBoilerplateDiscoveryCopy(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    t.includes("at competitive trade pricing") ||
    t.includes("sourced at trade pricing") ||
    t.includes("sourced from a south african supplier listing") ||
    t.includes("available through our wholesale sourcing network") ||
    (t.includes("trade-priced") && t.length < 120)
  );
}
