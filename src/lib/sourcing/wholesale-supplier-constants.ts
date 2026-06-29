import type { SupplierRegion, SupplierTier } from "@/types/supplier-sourcing";

export const JINA_READER = "https://r.jina.ai/";
export const USER_AGENT = "Mozilla/5.0 (compatible; AlmostAnythingBot/1.0)";

export const RETAIL_DOMAINS = [
  "amazon.",
  "takealot.com",
  "ebay.com",
  "checkers.co.za",
  "woolworths.co.za",
  "superbalist.com",
  "incredible.co.za",
];

export const SA_TRADE_DOMAINS = [
  "dischem.co.za",
  "clicks.co.za",
  "faithful-to-nature.co.za",
  "skinfunctional.co.za",
  "cosmetix.co.za",
  "beautysouthafrica.co.za",
];

export const SA_RETAILER_SITES = [
  "takealot.com",
  "loot.co.za",
  "exclusivebooks.co.za",
  "makro.co.za",
  "builders.co.za",
  "game.co.za",
  "incredible.co.za",
  "wantitall.co.za",
  "readerswarehouse.co.za",
  "onedayonly.co.za",
  "faithful-to-nature.co.za",
  "dischem.co.za",
  "clicks.co.za",
  "capeunionmart.co.za",
  "hificorp.co.za",
];

export const SA_IMAGE_ONLY_DOMAINS = ["takealot.com", ...SA_TRADE_DOMAINS];

export const WHOLESALE_DOMAINS = [
  "alibaba.com",
  "1688.com",
  "made-in-china.com",
  "globalsources.com",
  "dhgate.com",
  "tradekey.com",
  "indiamart.com",
  "hktdc.com",
];

export const SA_SIGNALS = [
  ".co.za",
  "south africa",
  "southafrican",
  "johannesburg",
  "cape town",
  "durban",
  "pretoria",
];

export type SearchTier = {
  region: SupplierRegion;
  tier: SupplierTier;
  query: (productQuery: string) => string;
};

export const SEARCH_TIERS: SearchTier[] = [
  { region: "south_africa", tier: "trade", query: (q) => `site:.co.za ${q} buy shop price` },
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) => `${q} wholesale supplier South Africa trade price MOQ bulk`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `${q} Dischem OR Clicks OR faithful to nature South Africa`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `${q} trade supplier Johannesburg Cape Town distributor cost`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:alibaba.com ${q} factory wholesale MOQ price`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:made-in-china.com ${q} manufacturer wholesale`,
  },
  {
    region: "international",
    tier: "wholesale",
    query: (q) => `site:globalsources.com ${q} supplier wholesale`,
  },
  {
    region: "international",
    tier: "wholesale",
    query: (q) => `${q} wholesale bulk supplier FOB price trade`,
  },
];

export type DirectSiteSearch = {
  domain: string;
  buildUrl: (query: string) => string;
  region: SupplierRegion;
  tier: SupplierTier;
  extractUrls: (markdown: string) => string[];
};

export const DIRECT_SA_SITE_SEARCHES: DirectSiteSearch[] = [
  {
    domain: "makro.co.za",
    buildUrl: (q) => `https://www.makro.co.za/search?q=${encodeURIComponent(q)}`,
    region: "south_africa",
    tier: "trade",
    extractUrls: (md) => {
      const matches = md.match(/https:\/\/www\.makro\.co\.za\/[^)\s"]+\/p\/itm[a-f0-9]+/gi) ?? [];
      return matches.map((u) => u.split("?")[0]);
    },
  },
  {
    domain: "faithful-to-nature.co.za",
    buildUrl: (q) =>
      `https://www.faithful-to-nature.co.za/catalogsearch/result/?q=${encodeURIComponent(q)}`,
    region: "south_africa",
    tier: "trade",
    extractUrls: (md) => {
      const skip = /catalogsearch|account|checkout|cart|blog|static|media|favicon/i;
      const matches =
        md.match(/https:\/\/www\.faithful-to-nature\.co\.za\/[a-z0-9-]+/gi) ?? [];
      return matches.filter((u) => !skip.test(u));
    },
  },
];
