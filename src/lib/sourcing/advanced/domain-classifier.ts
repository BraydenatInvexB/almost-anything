import "server-only";

import { llmCompleteJson, llmConfigured } from "@/lib/sourcing/llm-client";
import {
  ADVANCED_TIER_BY_TYPE,
  type AdvancedSupplierType,
  type AdvancedSupplierTier,
} from "@/lib/sourcing/advanced/types";

export interface ClassifiedDomain {
  domain: string;
  supplierType: AdvancedSupplierType;
  tier: AdvancedSupplierTier;
}

/** Secondhand / used marketplaces — hard block for new-stock-only sourcing. */
const EXCLUDED_DOMAINS = new Set([
  "gumtree.co.za",
  "olx.co.za",
  "bobshop.co.za",
  "cashconverters.co.za",
  "ebay.com",
  "facebook.com",
  "vinted.com",
  "junkmail.co.za",
]);

export function isExcludedSecondhandDomain(domain: string): boolean {
  const root = rootDomain(domain);
  return EXCLUDED_DOMAINS.has(root);
}

const KNOWN_DOMAINS: Record<string, AdvancedSupplierType> = {
  "takealot.com": "retailer",
  "makro.co.za": "retailer",
  "game.co.za": "retailer",
  "builders.co.za": "retailer",
  "incredible.co.za": "retailer",
  "amazon.com": "retailer",
  "amazon.co.uk": "retailer",
  "bidorbuy.co.za": "marketplace",
  "onedayonly.co.za": "marketplace",
  "alibaba.com": "wholesaler",
  "made-in-china.com": "wholesaler",
  "globalsources.com": "wholesaler",
  "aliexpress.com": "retailer",
};

export function rootDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./, "").split(".");
  return parts.length > 2 ? parts.slice(-2).join(".") : hostname.replace(/^www\./, "");
}

const CLASSIFY_SYSTEM = `You classify ecommerce domains for a South African resale company.
Types: manufacturer, wholesaler, distributor, marketplace, retailer.

Output JSON only:
{ "classifications": [ { "domain": string, "supplierType": "manufacturer"|"wholesaler"|"distributor"|"marketplace"|"retailer" } ] }`;

async function classifyUnknownDomainsWithAI(
  domains: string[],
): Promise<Record<string, AdvancedSupplierType>> {
  if (!domains.length || !llmConfigured()) {
    return Object.fromEntries(domains.map((d) => [d, "marketplace" as AdvancedSupplierType]));
  }

  try {
    const parsed = await llmCompleteJson(
      CLASSIFY_SYSTEM,
      `Domains: ${JSON.stringify(domains)}`,
      "anthropic",
    );
    const list = Array.isArray(parsed.classifications) ? parsed.classifications : [];
    const map: Record<string, AdvancedSupplierType> = {};
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      if (typeof row.domain === "string" && typeof row.supplierType === "string") {
        map[row.domain] = row.supplierType as AdvancedSupplierType;
      }
    }
    return map;
  } catch {
    return Object.fromEntries(domains.map((d) => [d, "marketplace" as AdvancedSupplierType]));
  }
}

export async function classifyDomains(urls: string[]): Promise<Map<string, ClassifiedDomain>> {
  const domains = [
    ...new Set(
      urls
        .map((u) => {
          try {
            return rootDomain(new URL(u).hostname);
          } catch {
            return "";
          }
        })
        .filter(Boolean),
    ),
  ].filter((d) => !isExcludedSecondhandDomain(d));

  const known: Record<string, AdvancedSupplierType> = {};
  const unknown: string[] = [];
  for (const d of domains) {
    if (KNOWN_DOMAINS[d]) known[d] = KNOWN_DOMAINS[d];
    else unknown.push(d);
  }

  const aiClassified = await classifyUnknownDomainsWithAI(unknown);
  const all = { ...known, ...aiClassified };

  const result = new Map<string, ClassifiedDomain>();
  for (const [domain, supplierType] of Object.entries(all)) {
    result.set(domain, {
      domain,
      supplierType,
      tier: ADVANCED_TIER_BY_TYPE[supplierType],
    });
  }
  return result;
}
