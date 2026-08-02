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
  /**
   * Who delivers:
   * - single store orders → usually the shop
   * - multi store orders → usually Almost Anything drivers
   * Admin can change both.
   */
  deliveryRouting: {
    singleStoreMode: "seller_self" | "platform_driver" | "courier_partner";
    multiStoreMode: "seller_self" | "platform_driver" | "courier_partner";
  };
  /**
   * Customer delivery fees at checkout (when not embedded in item price).
   * Normal = small/medium · Large item = large/bulky (e.g. TV, fridge).
   */
  deliveryFees: {
    standardZar: number;
    largeItemZar: number;
  };
  /** When true, live search can source missing products into the catalog. Default false. */
  liveSourcingEnabled?: boolean;
}
