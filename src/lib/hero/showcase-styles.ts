import type {
  HeroShowcaseConfig,
  HeroStickerColor,
  HeroStickerRotate,
} from "@/lib/admin/operations-types";

export const HERO_STICKER_STYLES: Record<HeroStickerColor, string> = {
  brand: "bg-brand text-white",
  blue: "bg-[#5BC8FF] text-black",
  purple: "bg-[#C7A8FF] text-black",
  green: "bg-[#7DE2A8] text-black",
};

export const HERO_STICKER_ROTATE: Record<HeroStickerRotate, string> = {
  left: "-rotate-2",
  right: "rotate-2",
  none: "",
};

export function getHeroItems(showcase: HeroShowcaseConfig) {
  return showcase.items.filter((item) => item.name.trim() && item.imageUrl.trim());
}
