export const NON_PRODUCT_TITLE =
  /\b(trade[\s-]?in|shop\s+all|all\s+products|view\s+all|browse\s+all|shop\s+\w+\s+online|shop\s+sleepwear|prices?\s+in\s+china|wholesale\s*&\s*retail|retail\s*&\s*wholesale|supplier\s+directory|showroom|countrysearch|category\s+page|catalogue\s+search|bulk\s+pricing|wholesale\s+pricing|price\s+list|products?\s+tagged\s+with|tagged\s+with|find\s+details\s+and\s+price|promotional\s+\w+\s+\w+|custom\s+branded)\b|(?:^|\s)(?:equipment|products?|accessories|collections?)\s*\|\s*|\b\w+\s+suppliers?\s*\|\s*\w+\s+manufacturers?\b/i;

export const CATALOG_PAGE_TITLE =
  /\b(bulk\s+pricing|wholesale\s+pricing|trade\s+pricing|price\s+list|suppliers?|distributors?|wholesalers?)\s*$/i;

export const NON_PRODUCT_SNIPPET =
  /\b(trade[\s-]?in\s+program|sell\s+your\s+device|we\s+buy\s+back|shop\s+all\s+\w+|browse\s+our\s+range)\b/i;

export const AGGREGATOR_PATH =
  /\/(showroom|countrysearch|trade|catalog|category|categories|search|company_profile|supplier|buyer|help|blog|collections?|tags?|tagged|brands?)\b/i;

export const ACCESSORY_LINE =
  /\b(case|cover|screen\s*replacement|lcd\s*display|touch\s*glass|battery\s*for|tempered\s*glass|screen\s*protector|glass\s*protector|charger|strap|band\s*for|housing|digitizer|flex\s*cable|tablet\s*soft\s*tpu|protective\s*case)\b/i;

export const ACCESSORY_INTENT_TERMS =
  /\b(case|cover|screen\s*protector|tempered\s*glass|glass\s*protector|charger|cable|strap|band|pouch|sleeve|stand|dock|adapter|skin|film|protector|airpods?\s*case|earbuds?\s*case)\b/i;

export const SPECIFIC_INTL_PRODUCT =
  /\b(night\s?gown|nightgown|sleepwear|pajamas?|pyjamas?|night\s?dress|chemise|sleep\s?dress|loungewear|wholesale\s+(?:custom\s+)?(?:solid|printed|cotton|silk|modal|luxury)\s+\w+\s+(?:for\s+)?(?:women|ladies|girls))\b/i;
