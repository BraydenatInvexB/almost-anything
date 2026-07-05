import "server-only";

import { parseQuery } from "@/lib/sourcing/advanced/query-parser";
import { dedupeHits } from "@/lib/sourcing/wholesale-supplier-enrich";
import { isSoftGoodsQuery, softGoodsSearchVariants } from "@/lib/sourcing/wholesale-listing-quality";
import type { WholesaleSearchHit } from "@/types/supplier-sourcing";

export async function searchWithVariants(
  searchFn: (q: string) => Promise<WholesaleSearchHit[]>,
  parsed: Awaited<ReturnType<typeof parseQuery>>,
  originalQuery: string,
): Promise<WholesaleSearchHit[]> {
  const trimmed = originalQuery.trim();
  const extraVariants = isSoftGoodsQuery(trimmed) ? softGoodsSearchVariants(trimmed) : [];
  const queries = [
    trimmed,
    parsed.canonicalProduct,
    ...extraVariants,
    ...parsed.searchVariants.filter((v) => v !== parsed.canonicalProduct && v !== trimmed),
  ]
    .filter((q) => q.length >= 2)
    .filter((q, i, arr) => arr.indexOf(q) === i)
    .slice(0, 6);

  const batches = await Promise.all(queries.map((q) => searchFn(q)));
  return dedupeHits(batches.flat());
}
