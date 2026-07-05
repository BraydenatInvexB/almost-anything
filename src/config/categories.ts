export type { StoreCategory } from "@/config/store-categories-data";
export { STORE_CATEGORIES } from "@/config/store-categories-data";
export type { CategoryGroup } from "@/config/category-groups";
export { CATEGORY_GROUPS } from "@/config/category-groups";

import type { StoreCategory } from "@/config/store-categories-data";
import { STORE_CATEGORIES } from "@/config/store-categories-data";
import type { CategoryGroup } from "@/config/category-groups";
import { CATEGORY_GROUPS } from "@/config/category-groups";

export const CATEGORY_BY_SLUG: Record<string, StoreCategory> = Object.fromEntries(
  STORE_CATEGORIES.map((c) => [c.slug, c]),
);

export function getGroupedCategories(): {
  group: CategoryGroup;
  categories: StoreCategory[];
}[] {
  return CATEGORY_GROUPS.map((group) => ({
    group,
    categories: group.slugs
      .map((slug) => CATEGORY_BY_SLUG[slug])
      .filter((c): c is StoreCategory => Boolean(c)),
  }));
}

export function getCategory(slug?: string): StoreCategory | undefined {
  if (!slug) return undefined;
  return CATEGORY_BY_SLUG[slug];
}
