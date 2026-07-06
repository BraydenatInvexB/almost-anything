"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingBag, Heart, User, LayoutGrid, ChevronDown } from "lucide-react";
import { STORE_CATEGORIES } from "@/config/categories";
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
  /** When true, renders the compact inner-page sticky header */
  variant?: "home" | "page";
}

const ICON_BTN =
  "relative flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand";
const PRIMARY_PILL =
  "inline-flex items-center rounded-lg border-2 border-black bg-black px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-white shadow-[2px_2px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand hover:text-white";
const SECONDARY_PILL =
  "inline-flex items-center rounded-lg border-2 border-black bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-black shadow-[2px_2px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-brand hover:text-white";
const COUNT_BADGE =
  "absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-black bg-brand px-1 text-[9px] font-extrabold text-white";

function CategoriesMenu({
  open,
  setOpen,
  activeCategory,
  align = "center",
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  activeCategory?: string;
  align?: "center" | "left";
}) {
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border-2 px-3.5 py-2 text-sm font-bold uppercase tracking-wide transition-colors",
          open ? "border-black bg-black text-white" : "border-transparent text-black hover:border-black hover:bg-brand hover:text-white",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Categories
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              "absolute z-50 mt-2 w-[460px] rounded-2xl border-[3px] border-black bg-white p-3 shadow-[6px_6px_0_0_#000]",
              align === "center" ? "left-1/2 -translate-x-1/2" : "left-0",
            )}
          >
            <div className="grid grid-cols-2 gap-1">
              {STORE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border-2 border-transparent px-3 py-2 text-sm font-semibold transition-colors hover:border-black hover:bg-brand hover:text-white",
                    activeCategory === cat.slug ? "border-black bg-brand text-white" : "text-neutral-800",
                  )}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full border border-black" style={{ backgroundColor: cat.color }} />
                  {cat.label}
                </Link>
              ))}
            </div>
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-lg border-2 border-black bg-black px-3 py-2.5 text-center text-sm font-extrabold uppercase text-white transition-colors hover:bg-brand hover:text-white"
            >
              Browse all products
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function SiteHeader({ activeCategory, searchQuery = "", variant = "page" }: SiteHeaderProps) {
  const router = useRouter();
  const { itemCount } = useCart();
  const { favoriteCount } = useFavorites();
  const { cartPulseKey, wishlistPulseKey } = useFeedback();
  const { user } = useAuth();
  const [catOpen, setCatOpen] = useState(false);

  const actions = (
    <div className="flex shrink-0 items-center gap-1.5">
      <Link href="/products" className={ICON_BTN} aria-label="Search products">
        <Search className="h-4 w-4 text-black" />
      </Link>
      <Link href="/cart" className={ICON_BTN} aria-label="Cart">
        <ShoppingBag
          key={`cart-icon-${cartPulseKey}`}
          className={cn(
            "h-4 w-4 text-black",
            cartPulseKey > 0 && "animate-action-pop",
          )}
        />
        {itemCount > 0 && (
          <span
            key={`cart-badge-${cartPulseKey}`}
            className={cn(COUNT_BADGE, cartPulseKey > 0 && "animate-badge-pop")}
          >
            {itemCount}
          </span>
        )}
      </Link>
      <Link href="/favorites" className={ICON_BTN} aria-label="Favorites">
        <Heart
          key={`wishlist-icon-${wishlistPulseKey}`}
          className={cn(
            "h-4 w-4",
            favoriteCount > 0 ? "fill-brand text-brand" : "text-black",
            wishlistPulseKey > 0 && "animate-action-pop",
          )}
        />
        {favoriteCount > 0 && (
          <span
            key={`wishlist-badge-${wishlistPulseKey}`}
            className={cn(COUNT_BADGE, wishlistPulseKey > 0 && "animate-badge-pop")}
          >
            {favoriteCount}
          </span>
        )}
      </Link>
      {user ? (
        <Link href="/account" aria-label="Account">
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata.full_name ?? "Account"}
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg border-2 border-black object-cover"
            />
          ) : (
            <span className={ICON_BTN}>
              <User className="h-4 w-4 text-black" />
            </span>
          )}
        </Link>
      ) : (
        <>
          <Link href="/signup" className={SECONDARY_PILL}>
            Register
          </Link>
          <Link href="/login" className={PRIMARY_PILL}>
            Sign in
          </Link>
        </>
      )}
    </div>
  );

  if (variant === "home") {
    const navLinks = [
      { label: "Shop all", href: "/products" },
      { label: "Deals", href: "/products?deals=true" },
      { label: "Businesses", href: "/businesses" },
      { label: "Track", href: "/track" },
    ];

    return (
      <header className="mb-4 flex items-center gap-4 px-1 py-3">
        <SiteLogo priority size="large" />
        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          <CategoriesMenu open={catOpen} setOpen={setCatOpen} activeCategory={activeCategory} />
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-full border-2 border-transparent px-3.5 py-2 text-sm font-bold uppercase tracking-wide text-black transition-colors hover:border-black hover:bg-brand hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto lg:ml-0">{actions}</div>
      </header>
    );
  }

  /* ── Standard sticky page header ────────────────────────── */
  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-black bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <SiteLogo priority />

          <form
            className="relative mx-auto flex w-full min-w-0 max-w-lg flex-1 items-center"
            onSubmit={(e) => {
              e.preventDefault();
              const q = (new FormData(e.currentTarget).get("search") as string).trim();
              router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
            }}
          >
            <input
              name="search"
              defaultValue={searchQuery}
              placeholder="Search for anything..."
              className="h-10 w-full rounded-lg border-2 border-black bg-white px-4 pr-12 text-sm font-medium text-black placeholder:text-neutral-400 focus:outline-none focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#000]"
            />
            <button
              type="submit"
              className="absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-md border-2 border-black bg-black text-white"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="hidden lg:block">
            <CategoriesMenu open={catOpen} setOpen={setCatOpen} activeCategory={activeCategory} align="left" />
          </div>

          {actions}
        </div>
      </div>
    </header>
  );
}
