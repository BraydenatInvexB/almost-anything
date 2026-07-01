import {
  type SearchTier,
  WHOLESALE_DOMAINS,
} from "@/lib/sourcing/wholesale-supplier-constants";
import { isNonProductListing } from "@/lib/sourcing/wholesale-listing-quality";
import { extractPrices, scoreHit } from "@/lib/sourcing/wholesale-supplier-scoring";
import {
  classifyDomain,
  domainFromUrl,
  isJunkListing,
  isProductPageUrl,
  isRetailPriceSource,
  resolveRedirectUrl,
  titleFromProductPath,
} from "@/lib/sourcing/wholesale-supplier-url";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

function titleForUddgMatch(content: string, index: number, url: string): string {
  const before = content.slice(Math.max(0, index - 220), index);
  const mdTitle = before.match(/\[([^\]]{4,140})\]\([^)]*$/);
  if (mdTitle?.[1]) return mdTitle[1].trim();
  const numbered = before.match(/(?:^|\n)\d+\.\s*([^\n\[]{4,140})/);
  if (numbered?.[1]) return numbered[1].trim();
  return titleFromProductPath(url) || "";
}

function parseDdgUddgResults(
  content: string,
  tier: SearchTier,
  query: string,
  existingUrls: Set<string>,
): WholesaleSearchHit[] {
  const hits: WholesaleSearchHit[] = [];

  for (const match of content.matchAll(/uddg=([^&"')]+)/gi)) {
    let url: string;
    try {
      url = resolveRedirectUrl(decodeURIComponent(match[1])).split("?")[0];
    } catch {
      continue;
    }
    if (existingUrls.has(url)) continue;
    existingUrls.add(url);

    const domain = domainFromUrl(url);
    if (
      !domain ||
      domain.includes("google.") ||
      domain.includes("youtube.") ||
      domain.includes("duckduckgo.") ||
      domain.includes("bing.com")
    ) {
      continue;
    }

    const classification = classifyDomain(domain);
    if (isRetailPriceSource(domain) || classification.retail) continue;

    const index = match.index ?? 0;
    const title = (titleForUddgMatch(content, index, url) || titleFromProductPath(url)).slice(0, 120);
    if (!title || isJunkListing(title, url)) continue;

    const contextStart = Math.max(0, index - 120);
    const contextEnd = Math.min(content.length, index + 320);
    const snippet = content
      .slice(contextStart, contextEnd)
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (isNonProductListing(title, url, snippet)) continue;
    const prices = extractPrices(`${title} ${snippet}`);

    const base: Omit<WholesaleSearchHit, "score"> = {
      title,
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

export function parseSearchResults(
  markdown: string,
  tier: SearchTier,
  query: string,
): WholesaleSearchHit[] {
  const hits: WholesaleSearchHit[] = [];
  const seenUrls = new Set<string>();
  const linkPattern = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(markdown)) !== null) {
    const rawTitle = match[1].trim();
    const url = resolveRedirectUrl(match[2]);
    const title = (rawTitle || titleFromProductPath(url)).slice(0, 120);
    const domain = domainFromUrl(url);
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);
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
    if (isRetailPriceSource(domain) || classification.retail) continue;
    const contextStart = Math.max(0, match.index - 120);
    const contextEnd = Math.min(markdown.length, match.index + 280);
    const snippet = markdown.slice(contextStart, contextEnd).replace(/\s+/g, " ").trim();

    if (isNonProductListing(title || url, url, snippet)) continue;

    if (!isProductPageUrl(url) && !WHOLESALE_DOMAINS.some((d) => domain.includes(d))) {
      if (!/wholesale|distributor|trade|moq|supplier|importer|factory/i.test(`${title} ${snippet}`)) {
        continue;
      }
    }

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

  if (hits.length < 3) {
    hits.push(...parseDdgUddgResults(markdown, tier, query, seenUrls));
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
