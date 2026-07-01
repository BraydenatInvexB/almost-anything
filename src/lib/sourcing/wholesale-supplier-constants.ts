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

export const SA_B2B_DISTRIBUTOR_DOMAINS = [
  "core.co.za",
  "mustek.co.za",
  "rectron.co.za",
  "syntech.co.za",
  "axiz.co.za",
  "comstor.co.za",
  "westconcomstor.com",
  "tarsus.co.za",
  "pinnacle.co.za",
  "datacentrix.co.za",
  "esquire.co.za",
  "homemation.co.za",
];

export const SA_TRADE_DOMAINS = [
  ...SA_B2B_DISTRIBUTOR_DOMAINS,
  "dischem.co.za",
  "clicks.co.za",
  "faithful-to-nature.co.za",
  "skinfunctional.co.za",
  "cosmetix.co.za",
  "beautysouthafrica.co.za",
];

/** Consumer marketplaces — never use for wholesale cost / discovery pricing. Images only via SA_IMAGE_ONLY_DOMAINS. */
export const RETAIL_MARKETPLACE_DOMAINS = [
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
  "checkers.co.za",
  "woolworths.co.za",
  "superbalist.com",
  "capeunionmart.co.za",
  "hificorp.co.za",
  "digicape.co.za",
  "istore.co.za",
  "apple.com",
  "bestbuy.com",
];

/** @deprecated Use RETAIL_MARKETPLACE_DOMAINS — kept for image-only lookups. */
export const SA_RETAILER_SITES = RETAIL_MARKETPLACE_DOMAINS;

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
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) => `site:.co.za ${q} wholesale trade supplier distributor MOQ`,
  },
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) => `${q} wholesale supplier South Africa trade price MOQ bulk`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `${q} importer distributor Johannesburg Cape Town trade cost`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `${q} trade supplier Johannesburg Cape Town distributor cost`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `site:.co.za ${q} distributor importer bulk trade`,
  },
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) => `${q} wholesaler Johannesburg Cape Town Durban .co.za trade`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:alibaba.com/product-detail ${q} wholesale factory price MOQ`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:made-in-china.com/product ${q} manufacturer wholesale`,
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
  {
    region: "international",
    tier: "wholesale",
    query: (q) => `site:alibaba.com ${q} wholesale used tablet "\\$" MOQ price`,
  },
];

/** SA wholesale web-search tiers (no retail marketplaces). */
export const SA_WHOLESALE_TIERS = SEARCH_TIERS.slice(0, 6);

/** International B2B — only used when SA trade search is thin. */
export const INTL_WHOLESALE_TIERS = SEARCH_TIERS.slice(6);

/** Price-focused SA queries — surfaces ZAR trade figures in snippets. */
export const SA_PRICE_TIERS: SearchTier[] = [
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `site:.co.za ${q} price ZAR trade distributor ex VAT`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `${q} trade price South Africa "R" wholesale distributor`,
  },
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) =>
      `site:core.co.za OR site:mustek.co.za OR site:rectron.co.za OR site:syntech.co.za ${q} price`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `${q} importer Johannesburg Cape Town "incl VAT" OR "ex VAT" .co.za`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `site:.co.za ${q} product "R" buy shop`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `${q} stationery school supplies South Africa .co.za price`,
  },
];

/** International B2B product-detail passes for low-cost consumables (stationery, fasteners, etc.). */
export const CONSUMABLE_INTL_TIERS: SearchTier[] = [
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:made-in-china.com/product ${q} US$ FOB MOQ`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:en.made-in-china.com/product ${q} pencil case US$`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:alibaba.com/product-detail ${q} US$ MOQ`,
  },
];

/** Price-focused international B2B queries. */
export const INTL_PRICE_TIERS: SearchTier[] = [
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:alibaba.com/product-detail ${q} "\\$" MOQ unit price`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:made-in-china.com/product ${q} FOB price USD`,
  },
  {
    region: "international",
    tier: "wholesale",
    query: (q) => `${q} wholesale factory price "\\$" MOQ bulk supplier`,
  },
];

export type DirectSiteSearch = {
  domain: string;
  buildUrl: (query: string) => string;
  region: SupplierRegion;
  tier: SupplierTier;
  extractUrls: (markdown: string) => string[];
};

/** Direct site searches disabled for pricing — retail catalogues are not wholesale sources. */
export const DIRECT_SA_SITE_SEARCHES: DirectSiteSearch[] = [];
