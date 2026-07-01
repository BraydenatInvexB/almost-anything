import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import { significantSearchTokens } from "@/lib/sourcing/query-relevance";
import { WHOLESALE_DOMAINS } from "@/lib/sourcing/wholesale-supplier-constants";
import { domainFromUrl, isJunkProductTitle, resolveRedirectUrl } from "@/lib/sourcing/wholesale-supplier-url";
import { containsSearchSnippetJunk } from "@/lib/sourcing/listing-copy-sanitizer";

const NON_PRODUCT_TITLE =
  /\b(trade[\s-]?in|shop\s+all|all\s+products|view\s+all|browse\s+all|prices?\s+in\s+china|wholesale\s*&\s*retail|retail\s*&\s*wholesale|supplier\s+directory|showroom|countrysearch|category\s+page|catalogue\s+search|bulk\s+pricing|wholesale\s+pricing|price\s+list|products?\s+tagged\s+with|tagged\s+with|find\s+details\s+and\s+price|promotional\s+\w+\s+\w+|custom\s+branded)\b|(?:^|\s)(?:equipment|products?|accessories|collections?)\s*\|\s*|\b\w+\s+suppliers?\s*\|\s*\w+\s+manufacturers?\b/i;

const CATALOG_PAGE_TITLE =
  /\b(bulk\s+pricing|wholesale\s+pricing|trade\s+pricing|price\s+list|suppliers?|distributors?|wholesalers?)\s*$/i;

const NON_PRODUCT_SNIPPET =
  /\b(trade[\s-]?in\s+program|sell\s+your\s+device|we\s+buy\s+back|shop\s+all\s+\w+|browse\s+our\s+range)\b/i;

const AGGREGATOR_PATH =
  /\/(showroom|countrysearch|trade|catalog|category|categories|search|company_profile|supplier|buyer|help|blog|collections?|tags?|tagged|brands?)\b/i;

const ACCESSORY_LINE =
  /\b(case|cover|screen\s*replacement|lcd\s*display|touch\s*glass|battery\s*for|tempered\s*glass|charger|strap|band\s*for|housing|digitizer|flex\s*cable|tablet\s*soft\s*tpu|protective\s*case)\b/i;

/** Parts / accessories when the shopper searched for a device. */
export function isAccessoryListing(query: string, title: string, snippet = ""): boolean {
  if (!/\b(ipad|iphone|apple\s*watch|macbook|galaxy\s*tab|tablet|smartphone|phone)\b/i.test(query)) {
    return false;
  }
  const blob = `${title} ${snippet}`.toLowerCase();
  if (!ACCESSORY_LINE.test(blob)) return false;
  if (/\b(complete\s*tablet|used\s+pad|tablet\s*pc|whole\s*unit|full\s*device)\b/i.test(blob)) {
    return false;
  }
  if (/\b(used|refurbished|second[\s-]?hand)\b/i.test(blob) && /\b(tablet|ipad)\b/i.test(blob)) {
    return false;
  }
  return true;
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
    if (AGGREGATOR_PATH.test(path)) return true;
    if (hostname.includes("alibaba.com") && !/\/product-detail\//i.test(path)) {
      const hasUnitPrice = /\$\s*[\d,]+(?:\.\d{1,2})?/.test(snippet);
      const specificLine =
        snippet.length > 40 &&
        !NON_PRODUCT_TITLE.test(title) &&
        !NON_PRODUCT_TITLE.test(snippet);
      if (hasUnitPrice && specificLine) return false;
      return true;
    }
    if (hostname.includes("made-in-china.com") && !/\/product\/|\/multi-search\//i.test(path)) {
      if (/\/showroom\/|\/company-|\/catalog\//i.test(path)) return true;
    }
    if (/\/(trade-in|tradein|sell-back|buyback)\b/i.test(path)) return true;
    if (/\/shop\/?$|\/store\/?$|\/all-products/i.test(path)) return true;
    if (/\/product-category\//i.test(path)) return true;
    if (/\/pages\/.*bulk|bulk[\s-]?pricing/i.test(path)) return true;
    if (/\b(bulk|wholesale)[\s-]?(pricing|prices)\b/i.test(t)) return true;
  } catch {
    return true;
  }

  return false;
}

/** Low-cost consumables where search snippets rarely include ZAR — enrich more listing pages. */
export function isLowCostConsumableQuery(query: string): boolean {
  return /\b(pencil|pen|stationery|notebook|eraser|marker|highlighter|pencil\s*case|screw|bolt|nut|washer|rivet|fastener|solder(ing)?\s*wire|flux|rosin)\b/i.test(
    query,
  );
}

/** Minimum plausible wholesale unit cost for the shopper's search. */
export function minWholesaleZarForQuery(query: string): number {
  const q = query.toLowerCase();
  if (/\bairpods?\s*max\b/i.test(q)) return 4500;
  if (/\bairpods?\s*pro\b/i.test(q)) return 2200;
  if (/\bairpods?\b/i.test(q)) return 1200;
  if (/\b(iphone|ipad\s*pro|macbook|apple\s*watch)\b/i.test(q)) return 2500;
  if (/\b(ipad|tablet|galaxy\s*tab|surface)\b/i.test(q)) return 1200;
  if (/\b(laptop|notebook|smartwatch|watch\s*series)\b/i.test(q)) return 1500;
  if (/\b(tv|television|monitor|console|playstation|xbox|nintendo\s*switch)\b/i.test(q)) return 800;
  if (/\b(headphones?|headset|earphones?|earbuds?|buds)\b/i.test(q)) return 400;
  if (/\b(book|novel|paperback|hardcover|isbn)\b/i.test(q)) return 60;
  if (/\b(pencil|pen|stationery|notebook|eraser|marker|highlighter|pencil\s*case)\b/i.test(q)) {
    return 8;
  }
  if (/\b(solder(ing)?\s*wire|solder\s*wire|flux|rosin)\b/i.test(q)) return 15;
  if (/\b(solder(ing)?\s*(gun|iron|station|kit)|heat\s*gun)\b/i.test(q)) return 35;
  if (/\b(screw|bolt|nut|washer|rivet|fastener)\b/i.test(q)) return 8;
  if (/\b(phone|smartphone|pixel|samsung\s*s)\b/i.test(q)) return 600;
  return 40;
}

/** Reject MOQ/bulk or mis-scraped prices for low-cost consumables. */
export function maxWholesaleZarForQuery(query: string): number {
  const q = query.toLowerCase();
  if (/\b(solder(ing)?\s*wire|solder\s*wire|flux|rosin)\b/i.test(q)) return 160;
  if (/\b(solder(ing)?\s*(gun|iron|station|kit)|heat\s*gun)\b/i.test(q)) return 900;
  if (/\b(screw|bolt|nut|washer|rivet|fastener)\b/i.test(q)) return 120;
  if (/\b(cable|wire|adapter|charger|usb)\b/i.test(q) && !/\b(laptop|macbook|iphone|ipad)\b/i.test(q)) {
    return 350;
  }
  if (/\b(book|novel|paperback)\b/i.test(q)) return 450;
  if (/\b(pencil\s*case|pencil\s*bag|stationery)\b/i.test(q)) return 220;
  return 35_000;
}

/** Final storefront name must reflect what the shopper searched for. */
export function productNameMatchesQuery(query: string, name: string): boolean {
  const tokens = significantSearchTokens(query);
  if (!tokens.length) return true;

  const nameLower = name.toLowerCase();
  const meaningful = tokens.filter((t) => t.length >= 4 || /^\d{2,}$/.test(t));
  const check = meaningful.length ? meaningful : tokens;

  const expanded = expandQuerySynonyms(check, query);

  const hits = expanded.filter((t) => nameLower.includes(t));
  if (!hits.length) return false;

  if (check.length >= 2) {
    const coreHits = check.filter((t) => nameLower.includes(t));
    if (coreHits.length >= 1) return true;
    return hits.length >= Math.min(check.length, Math.max(1, Math.ceil(check.length / 2)));
  }
  return true;
}

const TOOL_SYNONYM_GROUPS = [
  ["gun", "iron", "station"],
  ["wire", "cable", "lead"],
];

const STATIONERY_SYNONYM_GROUPS = [
  ["case", "pouch", "bag", "holder", "box"],
  ["pencil", "pen"],
];

function expandQuerySynonyms(tokens: string[], query: string): string[] {
  const q = query.toLowerCase();
  const out = new Set(tokens);

  if (/\bsolder/i.test(q)) {
    for (const token of tokens) {
      for (const group of TOOL_SYNONYM_GROUPS) {
        if (group.includes(token)) for (const alt of group) out.add(alt);
      }
    }
  }

  if (/\b(pencil|pen|stationery|case)\b/i.test(q)) {
    for (const token of tokens) {
      for (const group of STATIONERY_SYNONYM_GROUPS) {
        if (group.includes(token)) for (const alt of group) out.add(alt);
      }
    }
  }

  return [...out];
}

export function isPlausibleWholesalePrice(query: string, priceZar: number): boolean {
  if (!Number.isFinite(priceZar) || priceZar <= 0) return false;
  if (priceZar > maxWholesaleZarForQuery(query)) return false;
  return priceZar >= minWholesaleZarForQuery(query);
}

/** Store/brand name in title instead of a product — e.g. "Hobbytronics. Products tagged with…" */
export function isSupplierBrandedCatalogTitle(name: string, domain = ""): boolean {
  const t = name.trim();
  if (!t) return true;
  if (/\b(products?\s+tagged\s+with|find\s+details\s+and\s+price)\b/i.test(t)) {
    return true;
  }
  if (/\|\s*(?:irons?|stations?|products?|equipment|accessories|tools?|all)\b/i.test(t)) {
    return true;
  }
  if (/^[\w][\w\s'&-]{1,35}\.\s*(products?|shop|store|collections?)\b/i.test(t)) return true;

  const brand = domain.replace(/^www\./i, "").split(".")[0]?.trim();
  if (brand && brand.length >= 4) {
    const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`^${escaped}\\.?\\s`, "i").test(t) && /\b(products?|tagged|collection|shop)\b/i.test(t)) {
      return true;
    }
  }
  return false;
}

export function hasPublishablePrice(
  query: string,
  basePriceZar: number,
  retailPriceZar: number,
): boolean {
  if (!Number.isFinite(retailPriceZar) || retailPriceZar <= 0) return false;
  return isPlausibleWholesalePrice(query, basePriceZar);
}

export function zarFromUsd(usd: number): number {
  return Math.round(usd * ZAR_PER_USD * 100) / 100;
}

/** Prefer a concrete product line from the search snippet over DDG link titles. */
export function refineProductTitle(query: string, title: string, snippet: string): string {
  const tokens = significantSearchTokens(query);
  const brandToken = tokens.find((t) =>
    /^(ipad|iphone|apple|samsung|galaxy|airpods|macbook)$/i.test(t),
  );

  const productLine = snippet.match(
    new RegExp(
      `((?:Apple|Samsung|Sony|Bose|Used|Refurbished|Wholesale|Original)?\\s*(?:${brandToken ?? "iPad|iPhone|Apple Watch|MacBook|AirPods|Galaxy|Headphones"}[^.|\\n]{0,60}))`,
      "i",
    ),
  );
  if (productLine?.[1]) {
    const candidate = productLine[1]
      .replace(/\*\*/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100);
    if (
      candidate.length >= 12 &&
      !isNonProductListing(candidate, "", snippet) &&
      tokens.filter((tok) => candidate.toLowerCase().includes(tok)).length >= Math.min(2, tokens.length)
    ) {
      return candidate;
    }
  }

  const cleaned = title
    .replace(/\s*[-|–]\s*(wholesale|retail|solutions?|china|suppliers?|manufacturers?)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned.slice(0, 100);
}

/** Storefront product name — brand/model only, never supplier or wholesaler branding. */
export function stripSupplierFromProductName(name: string, supplierHints: string[] = []): string {
  let out = name.trim();

  const commaIdx = out.indexOf(",");
  if (commaIdx > 8) {
    const head = out.slice(0, commaIdx).trim();
    const tail = out.slice(commaIdx + 1).toLowerCase();
    const tailLooksLikeSupplier =
      /\b(wholesale|trade|supplier|distributor|bulk|b2b|via|mobitronics|core|mustek|rectron|syntech|axiz|comstor|tarsus|pinnacle|cellpex|ipadify|alibaba|chinavasion)\b/i.test(
        tail,
      ) || supplierHints.some((h) => h.length > 2 && tail.includes(h.toLowerCase()));
    if (tailLooksLikeSupplier) out = head;
  }

  out = out.replace(/\s+via\s+[A-Za-z0-9\s&.'()-]+$/i, "");
  out = out.replace(
    /\s*[-|–]\s*(?:verified\s+)?(?:wholesale|trade|bulk)(?:\s+(?:supply|sa|south africa|platform|drop[\s-]?ship))*\s*$/i,
    "",
  );
  out = out.replace(/\s+(?:wholesale|trade)\s+(?:sa|south africa)\s*$/i, "");

  for (const hint of supplierHints) {
    const token = hint.replace(/^www\./i, "").split(".")[0]?.trim();
    if (!token || token.length < 3) continue;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`^${escaped}\\.?\\s+`, "i"), "");
    out = out.replace(new RegExp(`\\s*[,|–-]?\\s*${escaped}(?:\\s+\\w+){0,3}\\s*`, "gi"), " ");
  }

  out = out.replace(/\s+(?:bulk\s+)?wholesale(?:\s+(?:units?|supply|sa|south africa|platform|drop[\s-]?ship))*\s*$/i, "");
  out = out.replace(/^wholesale\s+/i, "");
  out = out.replace(/\s+bulk\s+pricing\s*$/i, "");
  out = out.replace(/\s+wholesale\s+pricing\s*$/i, "");
  out = out.replace(/\s+bulk\s*$/i, "");

  return out.replace(/\s+/g, " ").trim();
}

/** B2B catalogue / pricing-page titles — not a product name. */
export function isCatalogPageTitle(name: string): boolean {
  const t = name.trim();
  if (!t) return true;
  if (CATALOG_PAGE_TITLE.test(t)) return true;
  if (/\b(bulk|wholesale)\s+pricing\b/i.test(t)) return true;
  if (isSupplierBrandedCatalogTitle(t)) return true;
  return false;
}

export function formatCustomerProductName(name: string, supplierHints: string[] = []): string {
  const stripped = name
    .replace(/^\[(?:hot item|new|featured|best seller)\]\s*/i, "")
    .replace(/\s*—\s*/g, " ")
    .replace(/\s*--\s*/g, " ");
  return stripSupplierFromProductName(stripped, supplierHints)
    .replace(/\s*\/\s*$/, "")
    .trim();
}

/** Prefer the shopper's search term when the listing title is a catalogue/pricing page. */
export function normalizeCustomerProductTitle(
  query: string,
  title: string,
  supplierHints: string[] = [],
): string {
  const hints = [...supplierHints, query];
  const formatted = formatCustomerProductName(title, hints);
  const domainHint = supplierHints.find((h) => h.includes(".")) ?? "";

  if (
    !isCatalogPageTitle(formatted) &&
    !/\bbulk\s+pricing\b/i.test(formatted) &&
    !isSupplierBrandedCatalogTitle(formatted, domainHint)
  ) {
    return formatted;
  }
  const fromQuery = query.trim().replace(/\s+/g, " ");
  if (fromQuery.length >= 3 && productNameMatchesQuery(query, fromQuery)) {
    return formatCustomerProductName(fromQuery, []);
  }
  return formatted.replace(/\s+bulk\s+pricing\s*$/i, "").trim() || fromQuery;
}

export function productNameIncludesSupplier(name: string): boolean {
  return (
    /,\s*[A-Za-z][^,]{2,}\b(wholesale|trade|supplier|distributor|bulk|via)\b/i.test(name) ||
    /\b(?:bulk\s+)?wholesale(?:\s+units?|\s+sa|\s+supply)?\s*$/i.test(name) ||
    isCatalogPageTitle(name) ||
    isSupplierBrandedCatalogTitle(name)
  );
}

export function isWholesaleProductDetailUrl(url: string): boolean {
  try {
    const { pathname, hostname } = new URL(resolveRedirectUrl(url));
    const host = hostname.toLowerCase();
    const path = pathname.toLowerCase();

    if (host.includes("alibaba.com")) return /\/product-detail\//i.test(path);
    if (host.includes("1688.com")) return /\/offer\//i.test(path);
    if (host.includes("made-in-china.com")) {
      return /\/product\/[^/]+\/[a-z0-9-]+\.html/i.test(path);
    }
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
  if (domain && /digicape|takealot|makro|incredible|istore|hificorp/i.test(domain)) return true;
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
