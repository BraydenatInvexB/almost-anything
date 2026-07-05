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
  defaultCourierId: string;
  enabledCourierIds: string[];
  currency: string;
  couriers: ConfigCourier[];
  heroShowcase: HeroShowcaseConfig;
}
