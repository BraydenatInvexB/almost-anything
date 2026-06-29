import type { HeroShowcaseConfig } from "@/lib/admin/operations-types";

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=600&h=600&fit=crop`;

export const DEFAULT_HERO_SHOWCASE: HeroShowcaseConfig = {
  panelLabel: "Just found for shoppers",
  buyButtonLabel: "Buy it now",
  items: [
    {
      id: "hero-1",
      searchQuery: "louis vuitton neverfull",
      name: "Louis Vuitton Neverfull",
      price: 11400,
      currency: "ZAR",
      deliveryDays: "3 to 5",
      imageUrl: IMG("photo-1584917865442-de89df76afd3"),
      inStock: true,
      stockLabel: "In stock",
    },
    {
      id: "hero-2",
      searchQuery: "playstation 5 console",
      name: "PlayStation 5 Console",
      price: 8999,
      currency: "ZAR",
      deliveryDays: "2 to 4",
      imageUrl: IMG("photo-1606813907291-d86efa9b94db"),
      inStock: true,
      stockLabel: "In stock",
    },
    {
      id: "hero-3",
      searchQuery: "nike air max sneakers",
      name: "Nike Air Max",
      price: 2499,
      currency: "ZAR",
      deliveryDays: "3 to 6",
      imageUrl: IMG("photo-1542291026-7eec264c27ff"),
      inStock: true,
      stockLabel: "In stock",
    },
    {
      id: "hero-4",
      searchQuery: "tag heuer carrera watch",
      name: "Tag Heuer Carrera",
      price: 42000,
      currency: "ZAR",
      deliveryDays: "4 to 7",
      imageUrl: IMG("photo-1524592094714-0f0654e20314"),
      inStock: true,
      stockLabel: "In stock",
    },
    {
      id: "hero-5",
      searchQuery: "nespresso coffee machine",
      name: "Nespresso Vertuo",
      price: 3200,
      currency: "ZAR",
      deliveryDays: "2 to 4",
      imageUrl: IMG("photo-1517668808822-9ebb02f2a0e6"),
      inStock: true,
      stockLabel: "In stock",
    },
  ],
  stickers: [
    { id: "sticker-1", label: "1,000s in stock", color: "brand", rotate: "left" },
    { id: "sticker-2", label: "Delivered fast", color: "blue", rotate: "right" },
    { id: "sticker-3", label: "One simple price", color: "brand", rotate: "left" },
  ],
};

export function mergeHeroShowcase(
  partial: Partial<HeroShowcaseConfig> | null | undefined,
): HeroShowcaseConfig {
  if (!partial || typeof partial !== "object") {
    return structuredClone(DEFAULT_HERO_SHOWCASE);
  }
  return {
    ...DEFAULT_HERO_SHOWCASE,
    ...partial,
    items:
      Array.isArray(partial.items) && partial.items.length > 0
        ? partial.items
        : DEFAULT_HERO_SHOWCASE.items,
    stickers:
      Array.isArray(partial.stickers) && partial.stickers.length > 0
        ? partial.stickers
        : DEFAULT_HERO_SHOWCASE.stickers,
  };
}
