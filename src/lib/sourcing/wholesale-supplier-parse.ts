import {
  type SearchTier,
  WHOLESALE_DOMAINS,
} from "@/lib/sourcing/wholesale-supplier-constants";
import { extractPrices, scoreHit } from "@/lib/sourcing/wholesale-supplier-scoring";
import {
  classifyDomain,
  domainFromUrl,
  isJunkListing,
  isProductPageUrl,
  resolveRedirectUrl,
} from "@/lib/sourcing/wholesale-supplier-url";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export function parseSearchResults(
  markdown: string,
  tier: SearchTier,
  query: string,
  options?: { allowRetailDomains?: string[] },
): WholesaleSearchHit[] {
  const hits: WholesaleSearchHit[] = [];
  const linkPattern = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(markdown)) !== null) {
    const title = match[1].trim();
    const url = resolveRedirectUrl(match[2]);
    const domain = domainFromUrl(url);
    if (
      !domain ||
      domain.includes("google.") ||
      domain.includes("youtube.") ||
      domain.includes("duckduckgo.") ||
      domain.includes("bing.com") ||
      domain.includes("microsoft.com")
    ) {
      continue;
    }

    const classification = classifyDomain(domain);
    if (isJunkListing(title || url, url)) continue;
    if (!isProductPageUrl(url) && !WHOLESALE_DOMAINS.some((d) => domain.includes(d))) continue;
    if (classification.retail && !options?.allowRetailDomains?.some((d) => domain.includes(d))) {
      continue;
    }

    const contextStart = Math.max(0, match.index - 120);
    const contextEnd = Math.min(markdown.length, match.index + 280);
    const snippet = markdown.slice(contextStart, contextEnd).replace(/\s+/g, " ").trim();
    const prices = extractPrices(`${title} ${snippet}`);

    const base: Omit<WholesaleSearchHit, "score"> = {
      title: title || url,
      url,
      snippet,
      domain,
      region: tier.region !== "unknown" ? tier.region : classification.region,
      tier: tier.tier !== "retail" ? tier.tier : classification.tier,
      estimatedPriceUsd: prices.usd,
      estimatedPriceZar: prices.zar,
    };

    hits.push({ ...base, score: scoreHit(base, tier, query) });
  }

  return hits;
}

export function extractRetailerUrlsFromDdg(markdown: string, domain: string): string[] {
  const urls = new Set<string>();

  for (const match of markdown.matchAll(/uddg=([^&"')]+)/gi)) {
    try {
      const decoded = decodeURIComponent(match[1]);
      if (decoded.includes(domain)) {
        const clean = resolveRedirectUrl(decoded).split("?")[0];
        if (isProductPageUrl(clean)) urls.add(clean);
      }
    } catch {
      /* ignore */
    }
  }

  const escapedDomain = domain.replace(".", "\\.");
  const productPath = new RegExp(
    `(?:https?:\\/\\/(?:www\\.)?)?${escapedDomain}/[a-z0-9-]+/PLID\\d+`,
    "gi",
  );
  for (const match of markdown.matchAll(productPath)) {
    const raw = match[0].startsWith("http") ? match[0] : `https://www.${match[0]}`;
    const clean = resolveRedirectUrl(raw).split("?")[0];
    if (isProductPageUrl(clean)) urls.add(clean);
  }

  for (const match of markdown.matchAll(
    new RegExp(`${escapedDomain}%2F[a-z0-9%-]+%2FPLID\\d+`, "gi"),
  )) {
    try {
      const decoded = `https://www.${decodeURIComponent(match[0])}`;
      const clean = decoded.split("?")[0];
      if (isProductPageUrl(clean)) urls.add(clean);
    } catch {
      /* ignore */
    }
  }

  for (const match of markdown.matchAll(
    new RegExp(`www\\.${escapedDomain}/[a-z0-9-]+/PLID\\d+`, "gi"),
  )) {
    urls.add(`https://${match[0]}`);
  }

  return [...urls];
}
