export interface ConfigCourier {
  id: string;
  name: string;
  baseCost: number;
  etaLabel: string;
  regions: string[];
}

export type HeroStickerColor = "brand" | "blue" | "purple" | "green";
export type HeroStickerRotate = "left" | "right" | "none";

export interface HeroShowcaseItem {
  id: string;
  searchQuery: string;
  name: string;
  price: number;
  currency: string;
  deliveryDays: string;
  imageUrl: string;
  inStock: boolean;
  stockLabel?: string;
  /** When set, the hero buy button links to this catalog product. */
  productSlug?: string;
}

export interface HeroSticker {
  id: string;
  label: string;
  color: HeroStickerColor;
  rotate: HeroStickerRotate;
}

export interface HeroShowcaseConfig {
  panelLabel: string;
  buyButtonLabel: string;
  items: HeroShowcaseItem[];
  stickers: HeroSticker[];
}

export interface ExtendedPlatformConfig {
  embedShippingInPrice: boolean;
  /** When true, orders above the threshold qualify for free delivery (if not embedded). */
  freeShippingEnabled: boolean;
  /** When true, charge the flat shipping fee at checkout (if not embedded and not free). */
  flatShippingFeeEnabled: boolean;
  defaultCourierId: string;
  enabledCourierIds: string[];
  currency: string;
  couriers: ConfigCourier[];
  heroShowcase: HeroShowcaseConfig;
}
