import type { CategoryItem, TeamMember } from "@/types";
import { STORE_CATEGORIES } from "@/config/categories";

export const SITE_CONFIG = {
  name: "Almost Anything",
  shortName: "AA",
  tagline: "The store that has almost everything.",
  logo: "/assets/red transparent no slogan.png",
  logoFull: "/assets/red transparent.png",
  description:
    "Almost Anything is an online store with almost everything: furniture, tech, home, and more, at great prices, delivered fast. Browse thousands of quality products at fair prices.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  defaultCurrency: "ZAR",
  defaultMarkupPercent: 18,
  minMarkupPercent: 8,
  maxMarkupPercent: 45,
  supportEmail: "hello@almostanything.store",
} as const;

export const NAV_CATEGORIES: CategoryItem[] = STORE_CATEGORIES.map((c) => ({
  id: c.slug,
  label: c.label,
  slug: c.slug,
}));

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Alex Rivera",
    role: "Head of Sourcing",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "2",
    name: "Morgan Lee",
    role: "Sourcing Research Lead",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  },
  {
    id: "3",
    name: "Jordan Kim",
    role: "Quality Analyst",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
];

