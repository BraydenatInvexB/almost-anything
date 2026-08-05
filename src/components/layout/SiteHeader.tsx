"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  ChevronDown,
  ChevronRight,
  Package,
  Store,
} from "lucide-react";
import { STORE_CATEGORIES } from "@/config/categories";
import { HOME_NAV_LINKS } from "@/config/home-marketplace";
import { cn } from "@/lib/utils/cn";
import { useCart } from "@/context/CartProvider";
import { useFavorites } from "@/context/FavoritesProvider";
import { useAuth } from "@/context/AuthProvider";
import { useFeedback } from "@/context/FeedbackProvider";
import { SiteLogo } from "@/components/layout/SiteLogo";
import Image from "next/image";

interface SiteHeaderProps {
  activeCategory?: string;
  searchQuery?: string;
  variant?: "home" | "page";
}

const COUNT_BADGE =
  "absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white";

function CategoriesMenu({
  open,
  setOpen,
  activeCategory,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  activeCategory?: string;
}) {
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors sm:px-3",
          open ? "bg-neutral-900 text-white" : "text-neutral-900 hover:bg-neutral-100",
        )}
      >
        <Menu className="h-4 w-4" strokeWidth={2} />
        <span className="hidden whitespace-nowrap sm:inline">Shop by Category</span>
        <span className="sm:hidden">Categories</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-2 w-[min(92vw,460px)] rounded-2xl border border-neutral-200 bg-white p-3 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-2 gap-1">
              {STORE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-brand-soft hover:text-brand",
                    activeCategory === cat.slug
                      ? "bg-brand-soft text-brand"
                      : "text-neutral-800",
                  )}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  {cat.label}
                </Link>
              ))}
            </div>
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl bg-neutral-900 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand"
            >
              Browse all products
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}

function SearchForm({ searchQuery = "", className }: { searchQuery?: string; className?: string }) {
  const router = useRouter();
  return (
    <form
      className={cn("relative flex w-full min-w-0 items-center", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = (new FormData(e.currentTarget).get("search") as string).trim();
        router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
      }}
    >
      <Search
        className="pointer-events-none absolute left-3.5 h-4 w-4 text-neutral-400 sm:left-4"
        aria-hidden
      />
      <input
        name="search"
        defaultValue={searchQuery}
        placeholder="Search almost anything..."
        className="h-10 w-full rounded-full border border-neutral-200 bg-white py-2 pl-10 pr-12 text-sm font-medium text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-brand/15 sm:h-11 sm:pl-11 sm:pr-14"
      />
      <button
        type="submit"
        className="absolute right-1 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-[#c80511] sm:right-1.5"
        aria-label="Search"
      >
        <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>
    </form>
  );
}

function UtilityActions() {
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();
  const { cartPulseKey, wishlistPulseKey } = useFeedback();
  const { user } = useAuth();

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <Link
        href="/track"
        className="hidden h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-brand lg:flex"
        aria-label="Track order"
      >
        <Package className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </Link>

      <Link
        href="/favorites"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-brand"
        aria-label="Wishlist"
      >
        <span className="relative">
          <Heart
            key={`wishlist-icon-${wishlistPulseKey}`}
            className={cn(
              "h-5 w-5",
              favoriteCount > 0 ? "fill-brand text-brand" : "",
              wishlistPulseKey > 0 && "animate-action-pop",
            )}
            strokeWidth={1.75}
          />
          {favoriteCount > 0 ? (
            <span
              key={`wishlist-badge-${wishlistPulseKey}`}
              className={cn(COUNT_BADGE, wishlistPulseKey > 0 && "animate-badge-pop")}
            >
              {favoriteCount}
            </span>
          ) : null}
        </span>
      </Link>

      <Link
        href="/cart"
        className="flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-neutral-300 hover:bg-white"
        aria-label="Cart"
      >
        <span className="relative">
          <ShoppingBag
            key={`cart-icon-${cartPulseKey}`}
            className={cn("h-5 w-5", cartPulseKey > 0 && "animate-action-pop")}
            strokeWidth={1.75}
          />
          {itemCount > 0 ? (
            <span
              key={`cart-badge-${cartPulseKey}`}
              className={cn(COUNT_BADGE, cartPulseKey > 0 && "animate-badge-pop")}
            >
              {itemCount}
            </span>
          ) : null}
        </span>
        <span className="hidden md:inline">Cart</span>
      </Link>

      {user ? (
        <Link href="/account" aria-label="Account" className="ml-0.5">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata.full_name ?? "Account"}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover ring-2 ring-neutral-100"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition-colors hover:bg-neutral-200">
              <User className="h-4 w-4" />
            </span>
          )}
        </Link>
      ) : (
        <div className="ml-0.5 flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-10 items-center whitespace-nowrap px-2 text-sm font-semibold text-neutral-700 transition-colors hover:text-brand sm:inline-flex"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="hidden h-10 items-center whitespace-nowrap rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand sm:inline-flex"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-white sm:hidden"
            aria-label="Sign in"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function SiteHeader({
  activeCategory,
  searchQuery = "",
  variant = "page",
}: SiteHeaderProps) {
  const [catOpen, setCatOpen] = useState(false);

  return (
    <header className={cn("z-50 bg-white px-3 pt-3 sm:px-4", variant === "page" && "sticky top-0")}>
      {/* Row 1 — logo · search · utilities (matches mockup desktop chrome) */}
      <div className="mx-auto max-w-[1600px] rounded-t-[1.35rem] border border-b-0 border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 lg:flex-nowrap lg:gap-6">
          <SiteLogo priority size="default" className="min-w-0" />

          <SearchForm searchQuery={searchQuery} className="order-3 min-w-0 basis-full lg:order-none lg:flex-1 lg:basis-auto" />

          <div className="ml-auto lg:ml-0"><UtilityActions /></div>
        </div>
      </div>

      {/* Row 2 — categories + nav + sell CTA */}
      <div className="mx-auto max-w-[1600px] rounded-b-[1.35rem] border border-t-neutral-100 border-neutral-200 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-1 overflow-x-auto px-4 py-2 sm:gap-2 sm:px-5">
          <CategoriesMenu open={catOpen} setOpen={setCatOpen} activeCategory={activeCategory} />

          <nav className="flex items-center gap-0.5">
            {HOME_NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 sm:px-3.5"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/sell"
            className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-xl border border-brand/25 bg-brand-soft px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-[#fad0d4] md:inline-flex"
          >
            <Store className="h-3.5 w-3.5" />
            Sell on Almost Anything
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
