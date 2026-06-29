/** Normalize search text for aggregation and deduplication. */
export function normalizeSearchQuery(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s'-]/g, "")
    .slice(0, 200);
}
