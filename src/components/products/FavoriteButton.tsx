"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useFavorites } from "@/context/FavoritesProvider";
import { WishlistPicker } from "@/components/products/WishlistPicker";
import type { ProductCardData } from "@/types";

interface FavoriteButtonProps {
  product: ProductCardData;
  className?: string;
}

export function FavoriteButton({ product, className }: FavoriteButtonProps) {
  const { isFavorite } = useFavorites();
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wasFavorited = useRef(isFavorite(product.slug));
  const favorited = isFavorite(product.slug);

  const item = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    currency: product.currency,
    imageUrl: product.imageUrl,
    rating: product.rating,
  };

  useEffect(() => {
    if (!favorited || wasFavorited.current === favorited) {
      wasFavorited.current = favorited;
      return;
    }
    wasFavorited.current = favorited;
    setAnimating(true);
    const t = window.setTimeout(() => setAnimating(false), 440);
    return () => window.clearTimeout(t);
  }, [favorited]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_0_#000] transition-colors hover:bg-neutral-50",
          favorited && "bg-brand/10",
          open && "ring-2 ring-brand ring-offset-1",
          className,
        )}
        onClick={handleClick}
        aria-label={favorited ? "Manage wishlist lists" : "Save to wishlist"}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors duration-200",
            favorited ? "fill-brand text-brand" : "text-black",
            animating && "animate-heart-save",
          )}
        />
      </button>
      <WishlistPicker
        product={item}
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef}
      />
    </>
  );
}
