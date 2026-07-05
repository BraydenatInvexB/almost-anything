export type { DiscoveredProductDraft } from "@/lib/sourcing/product-intelligence-types";
export { humanize, slugify } from "@/lib/sourcing/product-intelligence-types";
export { mapHitToDraft } from "@/lib/sourcing/product-intelligence-hit-mapper";
export { mapLlmProduct } from "@/lib/sourcing/product-intelligence-llm-mapper";
export {
  draftsFromHits,
  filterPublishableDrafts,
  pickRelevantHits,
  sortByRelevanceThenPrice,
  sortByWholesalePrice,
} from "@/lib/sourcing/product-intelligence-draft-utils";
