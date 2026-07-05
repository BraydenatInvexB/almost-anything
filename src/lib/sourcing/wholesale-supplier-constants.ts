export {
  CONSUMABLE_INTL_TIERS,
  DIRECT_SA_SITE_SEARCHES,
  INTL_PRICE_TIERS,
  INTL_WHOLESALE_TIERS,
  SA_PRICE_TIERS,
  SA_WHOLESALE_TIERS,
  SEARCH_TIERS,
  SOFT_GOODS_INTL_TIERS,
  SOFT_GOODS_SA_TIERS,
  type DirectSiteSearch,
  type SearchTier,
} from "@/lib/sourcing/wholesale-search-tiers";

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
  "sleepcollective",
  "thesleepcollective",
  "truworths.co.za",
  "bash.com",
  "ackermans.co.za",
  "edgars.co.za",
  "mrpg.com",
  "cottonon.com",
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

export const SA_APPAREL_WHOLESALE_DOMAINS = [
  "sinopool.co.za",
  "kws.sinopool.co.za",
  "nucleus.co.za",
  "goodada.co.za",
  "tomotex.co.za",
  "relaxcollection.co.za",
  "fashionfusion.co.za",
  "urban-legend.co.za",
  "itsmine.co.za",
];

export function isSaApparelWholesaleDomain(domain: string): boolean {
  const lower = domain.replace(/^www\./, "").toLowerCase();
  return SA_APPAREL_WHOLESALE_DOMAINS.some((d) => lower.includes(d));
}

export const SA_SOFT_GOODS_SEED_URLS: Array<{ url: string; title: string; domain: string }> = [
  {
    url: "https://kws.sinopool.co.za/product-category/apparel/underwear-sleepwear/",
    title: "Katherine Wholesale SA Underwear & Sleepwear",
    domain: "kws.sinopool.co.za",
  },
  {
    url: "https://www.goodada.co.za/apparel/finished-products/pajamas-sleepwear",
    title: "Goodada SA Pajamas & Sleepwear Suppliers",
    domain: "goodada.co.za",
  },
];

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
