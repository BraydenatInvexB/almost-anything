import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";

/** Minimum plausible wholesale unit cost for the shopper's search. */
export function minWholesaleZarForQuery(query: string): number {
  const q = query.toLowerCase();

  if (/\b(screen\s*protector|tempered\s*glass|glass\s*protector|privacy\s*glass)\b/i.test(q)) return 20;
  if (/\b(phone\s*case|iphone\s*case|samsung\s*case|tablet\s*case|ipad\s*case)\b/i.test(q)) return 25;
  if (/\b(charger|charging\s*cable|usb\s*cable|lightning\s*cable|type[\s-]?c\s*cable)\b/i.test(q)) return 30;
  if (/\b(phone\s*strap|phone\s*stand|phone\s*holder|phone\s*grip|pop\s*socket)\b/i.test(q)) return 20;
  if (/\b(earphone|earbud|wired\s*headphone|aux\s*cable)\b/i.test(q)) return 50;
  if (/\b(watch\s*strap|watch\s*band|apple\s*watch\s*band|smartwatch\s*strap)\b/i.test(q)) return 30;
  if (/\b(laptop\s*bag|laptop\s*sleeve|laptop\s*stand|laptop\s*cooling)\b/i.test(q)) return 80;
  if (/\b(tablet\s*cover|ipad\s*cover|keyboard\s*cover|stylus)\b/i.test(q)) return 40;
  if (/\b(power\s*bank|portable\s*charger)\b/i.test(q)) return 80;
  if (/\b(case|cover|protector|sleeve|pouch|skin|stand|holder|mount|grip|cable|adapter|dongle)\b/i.test(q)) return 20;
  if (/\b(cast\s*iron|skillet|frying\s*pan|wok|cookware|saucepan|pot\s*set|baking\s*pan)\b/i.test(q)) return 50;

  if (/\bairpods?\s*max\b/i.test(q)) return 4500;
  if (/\bairpods?\s*pro\b/i.test(q)) return 2200;
  if (/\bairpods?\b/i.test(q)) return 1200;
  if (/\b(iphone|ipad\s*pro|macbook|apple\s*watch)\b/i.test(q)) return 2500;
  if (/\b(ipad|tablet|galaxy\s*tab|surface)\b/i.test(q)) return 1200;
  if (/\b(laptop|notebook|smartwatch|watch\s*series)\b/i.test(q)) return 1500;
  if (/\b(tv|television|monitor|console|playstation|xbox|nintendo\s*switch)\b/i.test(q)) return 800;
  if (/\b(headphones?|headset|earphones?|earbuds?|buds)\b/i.test(q)) return 400;
  if (/\b(book|novel|paperback|hardcover|isbn)\b/i.test(q)) return 60;
  if (/\b(pencil|pen|stationery|notebook|eraser|marker|highlighter|pencil\s*case)\b/i.test(q)) return 8;
  if (/\b(night\s?gown|nightgown|sleepwear|pyjama|pajama|night\s?dress|chemise|sleep\s?dress|loungewear|lingerie|socks|underwear)\b/i.test(q)) {
    return 10;
  }
  if (/\b(solder(ing)?\s*wire|solder\s*wire|flux|rosin)\b/i.test(q)) return 15;
  if (/\b(solder(ing)?\s*(gun|iron|station|kit)|heat\s*gun)\b/i.test(q)) return 35;
  if (/\b(screw|bolt|nut|washer|rivet|fastener)\b/i.test(q)) return 8;
  if (/\b(phone|smartphone|pixel|samsung\s*s)\b/i.test(q)) return 600;
  return 40;
}

/** Reject MOQ/bulk or mis-scraped prices for low-cost consumables. */
export function maxWholesaleZarForQuery(query: string): number {
  const q = query.toLowerCase();
  if (/\b(screen\s*protector|tempered\s*glass|glass\s*protector|privacy\s*glass)\b/i.test(q)) return 800;
  if (/\b(phone\s*case|iphone\s*case|samsung\s*case|tablet\s*case|ipad\s*case)\b/i.test(q)) return 1200;
  if (/\b(charger|charging\s*cable|usb\s*cable|lightning\s*cable|type[\s-]?c\s*cable)\b/i.test(q)) return 600;
  if (/\b(power\s*bank|portable\s*charger)\b/i.test(q)) return 2500;
  if (/\b(watch\s*strap|watch\s*band|smartwatch\s*strap)\b/i.test(q)) return 600;
  if (/\b(laptop\s*bag|laptop\s*sleeve)\b/i.test(q)) return 1800;
  if (/\b(cast\s*iron|skillet|frying\s*pan|wok|cookware|saucepan)\b/i.test(q)) return 3500;
  if (/\b(case|cover|protector|sleeve|pouch|skin|stand|holder|mount|grip|adapter|dongle)\b/i.test(q)) return 1500;
  if (/\b(solder(ing)?\s*wire|solder\s*wire|flux|rosin)\b/i.test(q)) return 160;
  if (/\b(solder(ing)?\s*(gun|iron|station|kit)|heat\s*gun)\b/i.test(q)) return 900;
  if (/\b(screw|bolt|nut|washer|rivet|fastener)\b/i.test(q)) return 120;
  if (/\b(cable|wire|adapter|charger|usb)\b/i.test(q) && !/\b(laptop|macbook|iphone|ipad)\b/i.test(q)) return 350;
  if (/\b(book|novel|paperback)\b/i.test(q)) return 450;
  if (/\b(pencil\s*case|pencil\s*bag|stationery)\b/i.test(q)) return 220;
  if (/\b(night\s?gown|nightgown|sleepwear|pyjama|pajama|night\s?dress|chemise|sleep\s?dress|loungewear|lingerie)\b/i.test(q)) {
    return 1800;
  }
  return 35_000;
}

export function isPlausibleWholesalePrice(query: string, priceZar: number): boolean {
  if (!Number.isFinite(priceZar) || priceZar <= 0) return false;
  if (priceZar > maxWholesaleZarForQuery(query)) return false;
  return priceZar >= minWholesaleZarForQuery(query);
}

export function zarFromUsd(usd: number): number {
  return Math.round(usd * ZAR_PER_USD * 100) / 100;
}

export function hasPublishablePrice(
  query: string,
  basePriceZar: number,
  retailPriceZar: number,
): boolean {
  if (!Number.isFinite(retailPriceZar) || retailPriceZar <= 0) return false;
  return isPlausibleWholesalePrice(query, basePriceZar);
}
