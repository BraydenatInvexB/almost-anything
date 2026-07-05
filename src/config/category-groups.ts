import type { ProductCategory } from "@/types/database";

/** Logical groupings for navigation (sidebar, categories page). */
export interface CategoryGroup {
  id: string;
  label: string;
  slugs: ProductCategory[];
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "tech",
    label: "Tech & Electronics",
    slugs: ["electronics", "computers", "phones", "audio", "gaming"],
  },
  {
    id: "home",
    label: "Home & Living",
    slugs: ["home", "furniture", "garden"],
  },
  {
    id: "style",
    label: "Fashion & Wellness",
    slugs: ["fashion", "sleepwear", "womens", "mens", "lingerie", "jewelry", "beauty", "health", "sports"],
  },
  {
    id: "appliances",
    label: "Appliances",
    slugs: ["appliances", "kitchen"],
  },
  {
    id: "family",
    label: "Kids & Family",
    slugs: ["baby", "toys", "pets", "books"],
  },
  {
    id: "more",
    label: "Travel, Auto & More",
    slugs: ["travel", "automotive", "office", "general"],
  },
];
