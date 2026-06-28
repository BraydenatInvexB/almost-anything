"use client";

import { useState } from "react";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartProvider";
import { useFavorites } from "@/context/FavoritesProvider";
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
  const { toggleFavorite, isFavorite } = useFavorites();
  const [added, setAdded] = useState(false);

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
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleToggleFavorite() {
    toggleFavorite({ id: productId, slug, name, price, currency, imageUrl, rating });
  }

  const inCart = isInCart(slug);
  const favorited = isFavorite(slug);

  return (
    <div className="mt-8 flex gap-3">
      <Button
        size="lg"
        className="flex-1 rounded-full"
        onClick={handleAddToCart}
      >
        {added || inCart ? (
          <>
            <Check className="h-4 w-4" />
            {added ? "Added!" : "In Cart"}
          </>
        ) : (
          <>
            <ShoppingBag className="h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
      <Button
        variant="secondary"
        size="icon"
        className={cn("rounded-full", favorited && "bg-red-50")}
        onClick={handleToggleFavorite}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      >
        <Heart
          className={cn(
            "h-4 w-4",
            favorited ? "fill-red-500 text-red-500" : "text-neutral-600",
          )}
        />
      </Button>
    </div>
  );
}
