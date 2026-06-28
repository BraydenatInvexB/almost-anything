"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartProvider";
import { useFavorites } from "@/context/FavoritesProvider";
import { WishlistPicker } from "@/components/products/WishlistPicker";
import { cn } from "@/lib/utils/cn";

interface ProductActionsProps {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  rating: number;
}

export function ProductActions({
  productId,
  slug,
  name,
  price,
  currency,
  imageUrl,
  rating,
}: ProductActionsProps) {
  const { addItem, isInCart } = useCart();
  const { isFavorite } = useFavorites();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const heartRef = useRef<HTMLButtonElement>(null);
  const wasFavorited = useRef(isFavorite(slug));
  const timerRef = useRef<number | undefined>(undefined);

  const item = {
    id: productId,
    slug,
    name,
    price,
    currency,
    imageUrl,
    rating,
  };

  const inCart = isInCart(slug);
  const favorited = isFavorite(slug);
  const showCartSuccess = justAdded || inCart;

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!favorited || wasFavorited.current === favorited) {
      wasFavorited.current = favorited;
      return;
    }
    wasFavorited.current = favorited;
    setHeartAnimating(true);
    const t = window.setTimeout(() => setHeartAnimating(false), 440);
    return () => window.clearTimeout(t);
  }, [favorited]);

  function handleAddToCart() {
    addItem({
      type: "product",
      productId,
      slug,
      name,
      price,
      currency,
      imageUrl,
    });
    setJustAdded(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <div className="mt-8 flex gap-3">
      <Button
        size="lg"
        className={cn(
          "flex-1 rounded-full",
          showCartSuccess && "border-brand bg-brand hover:bg-brand",
          justAdded && "animate-action-success",
        )}
        onClick={handleAddToCart}
      >
        {showCartSuccess ? (
          <>
            <Check className="h-4 w-4" strokeWidth={3} />
            {justAdded ? "Added" : "In cart"}
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            Add to cart
          </>
        )}
      </Button>
      <Button
        ref={heartRef}
        variant="secondary"
        size="icon"
        className={cn(
          "rounded-full",
          favorited && "border-brand bg-brand/10",
          pickerOpen && "ring-2 ring-brand ring-offset-2",
        )}
        onClick={() => setPickerOpen(true)}
        aria-label={favorited ? "Manage wishlist lists" : "Save to wishlist"}
        aria-expanded={pickerOpen}
        aria-haspopup="dialog"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors duration-200",
            favorited ? "fill-brand text-brand" : "text-neutral-600",
            heartAnimating && "animate-heart-save",
          )}
        />
      </Button>
      <WishlistPicker
        product={item}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        anchorRef={heartRef}
      />
    </div>
  );
}
