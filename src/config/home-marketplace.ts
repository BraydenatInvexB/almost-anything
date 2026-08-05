import type { LucideIcon } from "lucide-react";
import {
  CookingPot,
  Cpu,
  Dumbbell,
  Globe2,
  Headphones,
  Lamp,
  Laptop,
  ShieldCheck,
  Shirt,
  Smartphone,
  Sofa,
  Sparkles,
  Tag,
  Truck,
} from "lucide-react";
import type { ProductCategory } from "@/types/database";
import { CATEGORY_BY_SLUG } from "@/config/categories";
import { productsBrowseHref } from "@/lib/catalog/products-url";

/** Curated home navigation using exact slugs and labels from the storefront taxonomy. */
type HomeCategoryLink = {
  label: string;
  href: string;
  icon: LucideIcon;
  featured?: boolean;
  slug: ProductCategory;
};

function homeCategory(slug: ProductCategory, icon: LucideIcon, featured = false): HomeCategoryLink {
  return {
    slug,
    icon,
    featured,
    label: CATEGORY_BY_SLUG[slug].label,
    href: productsBrowseHref({ category: slug }),
  };
}

export const HOME_CATEGORY_STRIP: HomeCategoryLink[] = [
  homeCategory("electronics", Cpu, true),
  homeCategory("computers", Laptop),
  homeCategory("phones", Smartphone),
  homeCategory("audio", Headphones),
  homeCategory("home", Lamp),
  homeCategory("kitchen", CookingPot),
  homeCategory("furniture", Sofa),
  homeCategory("fashion", Shirt),
  homeCategory("beauty", Sparkles),
  homeCategory("sports", Dumbbell),
];

export const HOME_TRUST_POINTS = [
  {
    icon: Globe2,
    title: "We search the world for you",
    body: "Local and international suppliers.",
  },
  {
    icon: Tag,
    title: "One simple price",
    body: "No hidden fees. No surprises.",
  },
  {
    icon: Truck,
    title: "Delivered to your door",
    body: "Quick, reliable delivery anywhere in SA.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & secure",
    body: "Your payments and data are protected.",
  },
] as const;

/** Floating lifestyle products for the hero visual (mockup composition). */
export const HERO_LIFESTYLE_PRODUCTS = [
  {
    id: "sneaker",
    alt: "White sneaker",
    src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    className: "left-[2%] top-[14%] w-[30%] sm:left-[4%] sm:w-[26%]",
    pedestal: true,
  },
  {
    id: "bag",
    alt: "Designer handbag",
    src: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
    className: "right-[0%] top-[8%] w-[28%] sm:right-[2%] sm:w-[24%]",
    pedestal: false,
  },
  {
    id: "speaker",
    alt: "Smart speaker",
    src: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    className: "bottom-[6%] left-[4%] w-[26%] sm:bottom-[8%] sm:w-[22%]",
    pedestal: true,
  },
  {
    id: "controller",
    alt: "Game controller",
    src: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=400&fit=crop",
    className: "bottom-[4%] right-[0%] w-[30%] sm:bottom-[6%] sm:right-[2%] sm:w-[26%]",
    pedestal: false,
  },
] as const;

export const HOME_NAV_LINKS = [
  { label: "Shop All", href: "/products" },
  { label: "Deals", href: "/products?deals=true" },
  { label: "Businesses", href: "/businesses" },
  { label: "New Arrivals", href: "/products?sort=newest" },
] as const;
