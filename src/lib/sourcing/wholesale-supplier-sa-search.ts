import { isRelevantProductHit, queryRelevanceScore, significantSearchTokens } from "@/lib/sourcing/query-relevance";
import {
  DIRECT_SA_SITE_SEARCHES,
  type DirectSiteSearch,
  SA_RETAILER_SITES,
  SEARCH_TIERS,
  type SearchTier,
} from "@/lib/sourcing/wholesale-supplier-constants";
import { fetchDuckDuckGoMarkdown, fetchPageMarkdown } from "@/lib/sourcing/wholesale-supplier-fetch";
import { extractRetailerUrlsFromDdg, parseSearchResults } from "@/lib/sourcing/wholesale-supplier-parse";
import { extractPrices, scoreHit } from "@/lib/sourcing/wholesale-supplier-scoring";
import {
  domainFromUrl,
  isJunkListing,
  resolveRedirectUrl,
  titleFromProductPath,
} from "@/lib/sourcing/wholesale-supplier-url";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

function hitsFromDirectUrls(
  urls: string[],
  site: DirectSiteSearch,
  query: string,
): WholesaleSearchHit[] {
  const tier: SearchTier = { region: site.region, tier: site.tier, query: (q) => q };
  const hits: WholesaleSearchHit[] = [];
  const seen = new Set<string>();

  for (const raw of urls) {
    const url = resolveRedirectUrl(raw);
    const domain = domainFromUrl(url);
    if (!domain.includes(site.domain) || seen.has(url)) continue;
    seen.add(url);

    const title = titleFromProductPath(url) || query;
    if (isJunkListing(title, url)) continue;
    if (queryRelevanceScore(query, title, "", url) < 20) continue;
    const prices = extractPrices(title);
    const base: Omit<WholesaleSearchHit, "score"> = {
      title,
      url,
      snippet: `${title} listed on ${site.domain}`,
      domain,
      region: site.region,
      tier: site.tier,
      estimatedPriceUsd: prices.usd,
      estimatedPriceZar: prices.zar,
    };
    hits.push({ ...base, score: scoreHit(base, tier, query) + 80 });
  }

  return hits;
}

function titleForRetailerUrl(markdown: string, url: string, query: string): string {
  const tokens = significantSearchTokens(query);
  const slugTitle = titleFromProductPath(url);

  for (const match of markdown.matchAll(/##\s+\[([^\]]+)\]/g)) {
    const candidate = match[1].split("|")[0].trim();
    if (tokens.some((t) => candidate.toLowerCase().includes(t))) return candidate;
  }

  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const slugPart = parts.find((p) => !/^PLID/i.test(p)) ?? "";
    if (slugPart && tokens.some((t) => slugPart.toLowerCase().includes(t))) {
      return slugPart.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch {
    /* ignore */
  }

  if (slugTitle && tokens.some((t) => slugTitle.toLowerCase().includes(t))) return slugTitle;
  return slugTitle || query;
}

export async function searchSaRetailerListings(query: string): Promise<WholesaleSearchHit[]> {
  const core = significantSearchTokens(query).join(" ") || query.trim();
  const sites = SA_RETAILER_SITES;
  const tier: SearchTier = { region: "south_africa", tier: "trade", query: (q) => q };
  const hits: WholesaleSearchHit[] = [];
  const seen = new Set<string>();

  const pages: { domain: string; markdown: string }[] = [];
  for (const domain of sites) {
    const markdown = await fetchDuckDuckGoMarkdown(`${core} site:${domain}`);
    pages.push({ domain, markdown });
  }

  for (const { domain, markdown } of pages) {
    if (!markdown) continue;

    const urlSet = new Set<string>(extractRetailerUrlsFromDdg(markdown, domain));
    for (const hit of parseSearchResults(markdown, tier, query, { allowRetailDomains: sites })) {
      urlSet.add(hit.url.split("?")[0]);
    }

    for (const clean of urlSet) {
      if (seen.has(clean)) continue;
      seen.add(clean);

      const title = titleForRetailerUrl(markdown, clean, query);
      if (isJunkListing(title, clean)) continue;
      if (!isRelevantProductHit(query, title, "", clean, 10)) continue;

      const base: Omit<WholesaleSearchHit, "score"> = {
        title,
        url: clean,
        snippet: `${title} listed on ${domain}`,
        domain: domainFromUrl(clean),
        region: "south_africa",
        tier: "trade",
        estimatedPriceUsd: undefined,
        estimatedPriceZar: undefined,
      };
      hits.push({ ...base, score: scoreHit(base, tier, query) + 150 });
    }
  }

  return hits;
}

export async function searchBroadSouthAfrica(query: string): Promise<WholesaleSearchHit[]> {
  const core = significantSearchTokens(query).join(" ") || query.trim();
  const saTiers = SEARCH_TIERS.slice(0, 4);
  const hits: WholesaleSearchHit[] = [];

  const pages = await Promise.all(
    saTiers.map(async (tier) => ({
      tier,
      markdown: await fetchDuckDuckGoMarkdown(tier.query(core)),
    })),
  );

  for (const { tier, markdown } of pages) {
    if (!markdown) continue;
    hits.push(
      ...parseSearchResults(markdown, tier, query, {
        allowRetailDomains: SA_RETAILER_SITES,
      }),
    );
  }

  return hits;
}

export async function searchDirectSaSites(query: string): Promise<WholesaleSearchHit[]> {
  const pages = await Promise.all(
    DIRECT_SA_SITE_SEARCHES.map(async (site) => ({
      site,
      markdown: await fetchPageMarkdown(site.buildUrl(query)),
    })),
  );

  const hits: WholesaleSearchHit[] = [];
  for (const { site, markdown } of pages) {
    if (!markdown) continue;
    hits.push(...hitsFromDirectUrls(site.extractUrls(markdown), site, query));
  }
  return hits;
}
