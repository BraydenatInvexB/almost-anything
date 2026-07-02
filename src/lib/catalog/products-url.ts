/** Category browse links — never carry search/deals/section filters. */
export function productsBrowseHref(options?: { category?: string; sort?: string }) {
  const params = new URLSearchParams();
  if (options?.category) params.set("category", options.category);
  if (options?.sort) params.set("sort", options.sort);
  const query = params.toString();
  return `/products${query ? `?${query}` : ""}`;
}
