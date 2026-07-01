import {
  RETAIL_DOMAINS,
  RETAIL_MARKETPLACE_DOMAINS,
  SA_B2B_DISTRIBUTOR_DOMAINS,
  SA_SIGNALS,
  SA_TRADE_DOMAINS,
  WHOLESALE_DOMAINS,
} from "@/lib/sourcing/wholesale-supplier-constants";
import type { SupplierRegion, SupplierTier } from "@/types/supplier-sourcing";

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function resolveRedirectUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    const uddg = url.searchParams.get("uddg");
    if (uddg) {
      const decoded = decodeURIComponent(uddg);
      if (decoded.startsWith("http")) return decoded.split("&")[0];
    }
  } catch {
    /* ignore */
  }
  return rawUrl.split(" ")[0].trim();
}

export function titleFromProductPath(url: string): string {
  try {
    const path = new URL(resolveRedirectUrl(url)).pathname;
    const slug = path.split("/").filter(Boolean)[0];
    if (!slug || slug === "p" || slug.length < 3) return "";
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "";
  }
}

export function isRetailPriceSource(domain: string): boolean {
  const lower = domain.toLowerCase();
  return (
    RETAIL_DOMAINS.some((d) => lower.includes(d)) ||
    RETAIL_MARKETPLACE_DOMAINS.some((d) => lower.includes(d))
  );
}

export function classifyDomain(domain: string): {
  region: SupplierRegion;
  tier: SupplierTier;
  retail: boolean;
} {
  const lower = domain.toLowerCase();
  if (isRetailPriceSource(lower)) {
    return { region: "unknown", tier: "retail", retail: true };
  }
  if (SA_B2B_DISTRIBUTOR_DOMAINS.some((d) => lower.includes(d))) {
    return { region: "south_africa", tier: "wholesale", retail: false };
  }
  if (SA_TRADE_DOMAINS.some((d) => lower.includes(d))) {
    return { region: "south_africa", tier: "trade", retail: false };
  }
  if (lower.endsWith(".co.za")) {
    return { region: "south_africa", tier: "trade", retail: false };
  }
  if (WHOLESALE_DOMAINS.some((d) => lower.includes(d))) {
    const sa = SA_SIGNALS.some((s) => lower.includes(s.replace(/\s/g, "")));
    return { region: sa ? "south_africa" : "international", tier: "wholesale", retail: false };
  }
  if (SA_SIGNALS.some((s) => lower.includes(s.replace(/\s/g, "")) || lower.endsWith(".co.za"))) {
    return { region: "south_africa", tier: "trade", retail: false };
  }
  return { region: "international", tier: "distributor", retail: false };
}

function isLikelySaShopProductPath(path: string, search: string): boolean {
  const lower = path.toLowerCase();
  if (!lower || lower === "/") return false;
  if (
    /\/(search|cart|checkout|account|login|register|blog|news|contact|about|faq|help|wishlist|compare|brand|brands|category|categories|catalogsearch|wp-admin|wp-content|tag|author)\b/i.test(
      lower,
    )
  ) {
    return false;
  }
  if (/[?&](q|s|search|category|cat)=/i.test(search)) return false;
  if (/\/(product|products|p|item|items|shop|buy|sku)\//i.test(lower)) return true;

  const segments = lower.split("/").filter(Boolean);
  if (segments.length >= 1 && segments.length <= 5) {
    const slug = segments[segments.length - 1];
    if (slug.length >= 4 && /^[a-z0-9][a-z0-9-]*$/i.test(slug) && !/^(page|index|home|shop)$/.test(slug)) {
      return true;
    }
  }
  return false;
}

export function isJunkListing(title: string, url: string): boolean {
  try {
    const host = new URL(resolveRedirectUrl(url)).hostname.toLowerCase();
    if (/gumtree|olx\.|cashconverters|vinted|junkmail|facebook\.com\/marketplace/i.test(host)) {
      return true;
    }
  } catch {
    /* ignore */
  }
  const t = title.toLowerCase();
  if (/\.(co\.za|com)\//.test(t) || /^www\./.test(t)) return true;
  if (/^[\w.-]+\.(co\.za|com)(\s|$)/.test(t)) return true;
  if (/\.\.\./.test(title)) return true;
  if (/\b(trade[\s-]?in|shop\s+all|prices?\s+in\s+china)\b/i.test(title)) return true;
  if (isJunkProductTitle(title)) return true;

  try {
    const { pathname, search, hostname } = new URL(resolveRedirectUrl(url));
    if (/\/search\b|\/catalogsearch\b|[?&]q=/.test(`${pathname}${search}`)) return true;
    if (/\/products?\/?$/i.test(pathname)) return true;
    if (pathname.split("/").filter(Boolean).length <= 1 && /\/products?\/?$/i.test(pathname)) {
      return true;
    }
    if (/my-catalogue|athome\.co\.za\/products/i.test(`${hostname}${pathname}`)) return true;
    if (/\/(showroom|countrysearch|trade-in|tradein)\b/i.test(pathname)) return true;
  } catch {
    return true;
  }
  return false;
}

const JUNK_PAGE_TITLE =
  /\b(store\s+unavailable|page\s+not\s+found|404\s+not\s+found|access\s+denied|coming\s+soon|under\s+construction|site\s+maintenance|temporarily\s+unavailable|error\s+404|not\s+available|product\s+unavailable|shop\s+closed|domain\s+for\s+sale|password\s+protected|enable\s+javascript)\b/i;

/** Dead-shop / error-page titles that are not product names. */
export function isJunkProductTitle(name: string): boolean {
  const t = name.trim();
  if (!t || t.length < 4) return true;
  if (JUNK_PAGE_TITLE.test(t)) return true;
  if (/^(home|shop|products?|catalogue|catalog|store|index|welcome)$/i.test(t)) return true;
  if (/\b(not available right now|just a moment|enable javascript|access denied)\b/i.test(t)) return true;
  if (/\b(bulk\s+pricing|wholesale\s+pricing|trade\s+pricing|price\s+list)\b/i.test(t)) return true;
  if (/\b(products?\s+tagged\s+with|find\s+details\s+and\s+price)\b/i.test(t)) return true;
  if (/\b(suppliers?|distributors?|wholesalers?)\s*$/i.test(t) && t.length < 48) return true;
  if (/https?:\/\/|www\.\w+\./i.test(t)) return true;
  return false;
}

export function isValidProductName(name: string): boolean {
  const trimmed = name.trim().slice(0, 120);
  if (trimmed.length < 4) return false;

  const t = trimmed.toLowerCase();
  if (/\.(co\.za|com)\//.test(t) || /^www\./.test(t)) return false;
  if (/^[\w.-]+\.(co\.za|com)(\s|$)/.test(t)) return false;
  if (/\.\.\./.test(trimmed)) return false;
  if (/^airfryers(\s+air fryer)?$/i.test(trimmed)) return false;
  if (isJunkProductTitle(trimmed)) return false;

  return true;
}

export function isProductPageUrl(url: string): boolean {
  try {
    const u = new URL(resolveRedirectUrl(url));
    const path = u.pathname;
    const host = u.hostname.toLowerCase();

    if (host.includes("makro.co.za") && /\/p\/itm[a-f0-9]+/i.test(path)) return true;
    if (host.includes("takealot.com") && /\/PLID\d+/i.test(path)) return true;
    if (host.includes("loot.co.za") && path.split("/").filter(Boolean).length >= 2) return true;
    if (host.includes("exclusivebooks.co.za") && path.split("/").filter(Boolean).length >= 2) {
      return true;
    }
    if (host.includes("faithful-to-nature.co.za")) {
      const segments = path.split("/").filter(Boolean);
      if (segments.length === 1 && !/catalogsearch|account|blog|cart/i.test(path)) return true;
    }
    if (host.includes("builders.co.za") && /\/p\d+/i.test(path)) return true;
    if (host.includes("game.co.za") && /\/product\//i.test(path)) return true;
    if (host.includes("incredible.co.za") && /\/(product|p)\//i.test(path)) return true;
    if (host.includes("alibaba.com")) return /\/product-detail\//i.test(path);
    if (host.includes("1688.com")) return /\/offer\//i.test(path);
    if (host.includes("made-in-china.com")) return /\/product\/[^/]+\//i.test(path);
    if (WHOLESALE_DOMAINS.some((d) => host.includes(d))) {
      return !/\/(showroom|countrysearch|trade|catalog|category)\b/i.test(path);
    }

    if (host.endsWith(".co.za") || host.endsWith(".africa")) {
      return isLikelySaShopProductPath(path, u.search);
    }
    return false;
  } catch {
    return false;
  }
}
