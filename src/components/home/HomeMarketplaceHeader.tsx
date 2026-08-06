"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Search, ShoppingBag, Store, User } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { useCart } from "@/context/CartProvider";
import { useFavorites } from "@/context/FavoritesProvider";
import { SiteLogo } from "@/components/layout/SiteLogo";
import type { StorefrontPromotion } from "@/lib/marketing/storefront-promotions";

const DEFAULT_TABS = [
  { label: "All", href: "/products" },
  { label: "New", href: "/products?sort=newest" },
  { label: "Deals", href: "/products?deals=true" },
] as const;

export function HomeMarketplaceHeader({
  promotions,
}: {
  promotions: StorefrontPromotion[];
}) {
  const router = useRouter();
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();
  const { user } = useAuth();
  const tabs = [
    ...DEFAULT_TABS,
    ...promotions.map((promotion) => ({
      label: promotion.label,
      href: `/products?event=${encodeURIComponent(promotion.slug)}`,
    })),
  ];

  return (
    <header className="border-b border-neutral-100 px-5 py-5 sm:px-7 lg:px-9">
      <div className="flex flex-wrap items-center gap-4">
        <SiteLogo priority className="min-[1100px]:hidden" />

        <nav className="order-4 flex max-w-full overflow-x-auto rounded-full bg-neutral-50 p-1 min-[1100px]:order-none">
          {tabs.map((tab, index) => (
            <Link key={tab.href} href={tab.href} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${index === 0 ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500 hover:text-neutral-950"}`}>
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/sell" className="hidden h-11 items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-4 text-sm font-semibold text-brand transition-colors hover:border-brand/35 hover:bg-white md:inline-flex">
            <Store className="h-[17px] w-[17px]" />
            <span>Sell on Almost Anything</span>
          </Link>
          <Link href="/favorites" aria-label="Wishlist" className="relative flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50">
            <Heart className="h-[18px] w-[18px]" />
            {favoriteCount > 0 ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">{favoriteCount}</span> : null}
          </Link>
          <Link href="/cart" className="flex h-11 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-brand">
            <ShoppingBag className="h-[17px] w-[17px]" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 ? <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[10px]">{itemCount}</span> : null}
          </Link>
          <Link href={user ? "/account" : "/login"} aria-label={user ? "Account" : "Sign in"} className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand text-white">
            {user?.user_metadata?.avatar_url ? <Image src={user.user_metadata.avatar_url} alt="Account" width={44} height={44} className="h-full w-full object-cover" /> : <User className="h-[18px] w-[18px]" />}
          </Link>
        </div>
      </div>

      <form
        className="mt-5 flex items-center rounded-full border border-neutral-200 bg-white p-1 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
          router.push(query ? `/products?q=${encodeURIComponent(query)}` : "/products");
        }}
      >
        <Search className="ml-3 h-4 w-4 text-neutral-400" />
        <input name="q" placeholder="Search almost anything..." aria-label="Search products" className="h-10 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-neutral-400" />
        <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white" aria-label="Search"><Search className="h-4 w-4" /></button>
      </form>
    </header>
  );
}
