import { productMatchesModelIntent } from "@/lib/catalog/product-model-match";
import { significantSearchTokens } from "@/lib/sourcing/query-relevance";
import { CATALOG_PAGE_TITLE } from "@/lib/sourcing/wholesale-listing-patterns";
import { isNonProductListing } from "@/lib/sourcing/wholesale-listing-non-product";
import { isSoftGoodsQuery } from "@/lib/sourcing/wholesale-listing-soft-goods";

const TOOL_SYNONYM_GROUPS = [
  ["gun", "iron", "station"],
  ["wire", "cable", "lead"],
];

const STATIONERY_SYNONYM_GROUPS = [
  ["case", "pouch", "bag", "holder", "box"],
  ["pencil", "pen"],
];

const SOFT_GOODS_SYNONYM_GROUPS = [
  ["gown", "nightgown", "nightdress", "night", "dress", "sleepwear", "pajama", "pajamas", "pyjama", "loungewear", "nightie", "chemise", "robe"],
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

  if (isSoftGoodsQuery(q)) {
    if (/\bnight\b/.test(q) && tokens.includes("gown")) {
      out.add("nightgown");
      out.add("nightdress");
    }
    if (/\bnightgown\b/.test(q)) {
      out.add("night");
      out.add("gown");
    }
    for (const term of ["sleepwear", "nightgown", "nightdress", "pyjama", "pajama", "loungewear"]) {
      if (q.includes(term)) out.add(term);
    }
    for (const token of tokens) {
      for (const group of SOFT_GOODS_SYNONYM_GROUPS) {
        if (group.includes(token)) for (const alt of group) out.add(alt);
      }
    }
  }

  return [...out];
}

export function productNameMatchesQuery(query: string, name: string): boolean {
  if (!productMatchesModelIntent(query, name)) return false;

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

export function isSupplierBrandedCatalogTitle(name: string, domain = ""): boolean {
  const t = name.trim();
  if (!t) return true;
  if (/\b(products?\s+tagged\s+with|find\s+details\s+and\s+price)\b/i.test(t)) return true;
  if (/\|\s*(?:irons?|stations?|products?|equipment|accessories|tools?|all)\b/i.test(t)) return true;
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

export function refineProductTitle(query: string, title: string, snippet: string): string {
  const tokens = significantSearchTokens(query);
  const brandToken = tokens.find((t) => /^(ipad|iphone|apple|samsung|galaxy|airpods|macbook)$/i.test(t));

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

  return title
    .replace(/\s*[-|–]\s*(wholesale|retail|solutions?|china|suppliers?|manufacturers?)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

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
  return stripSupplierFromProductName(stripped, supplierHints).replace(/\s*\/\s*$/, "").trim();
}

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
