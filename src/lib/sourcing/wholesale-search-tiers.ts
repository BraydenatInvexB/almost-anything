import type { SupplierRegion, SupplierTier } from "@/types/supplier-sourcing";

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

export const SA_WHOLESALE_TIERS = SEARCH_TIERS.slice(0, 6);
export const INTL_WHOLESALE_TIERS = SEARCH_TIERS.slice(6);

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

export const SOFT_GOODS_SA_TIERS: SearchTier[] = [
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) =>
      `site:sinopool.co.za OR site:kws.sinopool.co.za ${q} sleepwear underwear wholesale`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `site:goodada.co.za ${q} pajamas sleepwear South Africa trade`,
  },
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) => `site:tomotex.co.za ${q} wholesale clothing manufacturer South Africa`,
  },
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) => `site:.co.za ${q} sleepwear nightgown wholesale trade supplier`,
  },
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) => `${q} womenswear lingerie importer Johannesburg Cape Town .co.za wholesale`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `site:.co.za ${q} pajamas nightie nightdress "R" wholesale distributor`,
  },
  {
    region: "south_africa",
    tier: "wholesale",
    query: (q) =>
      `site:nucleus.co.za OR site:fashionfusion.co.za OR site:urban-legend.co.za ${q} wholesale`,
  },
  {
    region: "south_africa",
    tier: "trade",
    query: (q) => `${q} sleepwear manufacturer South Africa factory trade MOQ`,
  },
];

export const SOFT_GOODS_INTL_TIERS: SearchTier[] = [
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:made-in-china.com/product ${q} sleepwear FOB US$ MOQ`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:en.made-in-china.com/product ${q} nightgown US$`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:alibaba.com/product-detail ${q} nightgown US$ MOQ wholesale`,
  },
  {
    region: "international",
    tier: "manufacturer",
    query: (q) => `site:alibaba.com/product-detail women ${q} cotton wholesale "\\$"`,
  },
];

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

export const DIRECT_SA_SITE_SEARCHES: DirectSiteSearch[] = [];
