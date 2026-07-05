/** Low-cost consumables where search snippets rarely include ZAR — enrich more listing pages. */
export function isLowCostConsumableQuery(query: string): boolean {
  return /\b(pencil|pen|stationery|notebook|eraser|marker|highlighter|pencil\s*case|screw|bolt|nut|washer|rivet|fastener|solder(ing)?\s*wire|flux|rosin)\b/i.test(
    query,
  );
}

/** Apparel, sleepwear, and soft goods — often only on international B2B product-detail pages. */
export function isSoftGoodsQuery(query: string): boolean {
  return /\b(night\s?gown|nightgown|sleepwear|pyjama|pajama|loungewear|night\s?dress|chemise|sleep\s?dress|lingerie|underwear|socks|t[\s-]?shirt|shirt|dress|blouse|skirt|pants|trousers|leggings|hoodie|sweater|jumper|cardigan|apparel|clothing|garment|textile|fabric|robe)\b/i.test(
    query,
  );
}

/** Extra search strings for apparel where spacing/hyphenation varies ("night gown" vs "nightgown"). */
export function softGoodsSearchVariants(query: string): string[] {
  const trimmed = query.trim();
  const variants = new Set<string>([trimmed]);

  if (/\bnight\s+gown\b/i.test(trimmed)) {
    variants.add(trimmed.replace(/\bnight\s+gown\b/gi, "nightgown"));
    variants.add(`${trimmed.replace(/\bnight\s+gown\b/gi, "nightgown")} wholesale`);
  }
  if (/\bnightgown\b/i.test(trimmed)) {
    variants.add(trimmed.replace(/\bnightgown\b/gi, "night gown"));
  }
  if (/\b(sleepwear|pyjama|pajama|night\s?dress)\b/i.test(trimmed)) {
    variants.add(`${trimmed} wholesale MOQ`);
  }

  return [...variants].filter((v) => v.length >= 3);
}
