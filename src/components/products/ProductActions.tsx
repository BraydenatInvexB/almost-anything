"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartProvider";
import { useFavorites } from "@/context/FavoritesProvider";
import { WishlistPicker } from "@/components/products/WishlistPicker";
import { cn } from "@/lib/utils/cn";
import type { ProductVariantsConfig } from "@/types/product-variants";
import {
  findVariant,
  isVariantAvailable,
  resolveVariantPrice,
  variantLabel,
} from "@/types/product-variants";

interface ProductActionsProps {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  imageUrl: string;
  rating: number;
  stockStatus: string;
  variants?: ProductVariantsConfig | null;
  minimumOrderQuantity?: number;
}

const COLOUR_HEX: Record<string, string> = {
  black: "#171717",
  white: "#f5f5f5",
  grey: "#9ca3af",
  gray: "#9ca3af",
  navy: "#1e3a5f",
  beige: "#d6c6a8",
  brown: "#78350f",
  green: "#166534",
  blue: "#1d4ed8",
  red: "#b91c1c",
  oak: "#a67c52",
  walnut: "#5c4033",
  cream: "#fef3c7",
  charcoal: "#374151",
};

function colourSwatch(value: string): string | null {
  const key = value.toLowerCase().replace(/\s+/g, "");
  for (const [name, hex] of Object.entries(COLOUR_HEX)) {
    if (key.includes(name)) return hex;
  }
  return null;
}

export function ProductActions({
  productId,
  slug,
  name,
  price,
  currency,
  imageUrl,
  rating,
  stockStatus,
  variants,
  minimumOrderQuantity = 1,
}: ProductActionsProps) {
  const { addItem, isInCart } = useCart();
  const { isFavorite } = useFavorites();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [heartAnimating, setHeartAnimating] = useState(false);
  const heartRef = useRef<HTMLButtonElement>(null);
  const wasFavorited = useRef(isFavorite(slug));
  const timerRef = useRef<number | undefined>(undefined);

  const [quantity, setQuantity] = useState(minimumOrderQuantity);

  useEffect(() => {
    setQuantity((q) => Math.max(minimumOrderQuantity, q));
  }, [minimumOrderQuantity]);

  const [selections, setSelections] = useState<Record<string, string>>(() => {
    if (!variants?.options.length) return {};
    return Object.fromEntries(
      variants.options.map((opt) => [opt.name, opt.values[0] ?? ""]),
    );
  });

  const selectedVariant = useMemo(
    () => (variants ? findVariant(variants, selections) : null),
    [variants, selections],
  );

  const displayPrice = resolveVariantPrice(price, selectedVariant);
  const inStock = isVariantAvailable(
    selectedVariant,
    stockStatus !== "out_of_stock",
  );

  const cartKey = selectedVariant?.id ?? "";
  const inCart = isInCart(slug, cartKey);
  const showCartSuccess = justAdded || inCart;

  const item = {
    id: productId,
    slug,
    name,
    price: displayPrice,
    currency,
    imageUrl: selectedVariant?.imageUrl ?? imageUrl,
    rating,
  };

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!isFavorite(slug) || wasFavorited.current === isFavorite(slug)) {
      wasFavorited.current = isFavorite(slug);
      return;
    }
    wasFavorited.current = isFavorite(slug);
    setHeartAnimating(true);
    const t = window.setTimeout(() => setHeartAnimating(false), 440);
    return () => window.clearTimeout(t);
  }, [isFavorite, slug]);

  function handleAddToCart() {
    if (!inStock) return;
    const label = selectedVariant ? variantLabel(selectedVariant) : undefined;
    addItem({
      type: "product",
      productId,
      slug,
      name: label ? `${name} (${label})` : name,
      price: displayPrice,
      currency,
      imageUrl: selectedVariant?.imageUrl ?? imageUrl,
      variantId: selectedVariant?.id,
      variantLabel: label,
      selectedOptions: selectedVariant ? { ...selections } : undefined,
      minimumOrderQuantity,
      quantity,
    });
    setJustAdded(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setJustAdded(false), 1400);
  }

  return (
    <div className="mt-8">
      {variants?.options.length ? (
        <div className="mb-5 space-y-4">
          {variants.options.map((opt) => (
            <div key={opt.name}>
              <p className="text-sm font-semibold text-neutral-900">
                {opt.name}
                {selections[opt.name] ? (
                  <span className="ml-2 font-normal text-neutral-500">{selections[opt.name]}</span>
                ) : null}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {opt.values.map((value) => {
                  const active = selections[opt.name] === value;
                  const swatch =
                    opt.name.toLowerCase().includes("colour") ||
                    opt.name.toLowerCase().includes("color")
                      ? colourSwatch(value)
                      : null;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelections((prev) => ({ ...prev, [opt.name]: value }))}
                      className={cn(
                        "rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "border-neutral-900 bg-neutral-900 text-white"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-900",
                        swatch && "flex items-center gap-2",
                      )}
                    >
                      {swatch ? (
                        <span
                          className="h-4 w-4 rounded-full border border-neutral-300"
                          style={{ backgroundColor: swatch }}
                        />
                      ) : null}
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {selectedVariant && selectedVariant.stock !== undefined && selectedVariant.stock <= 3 ? (
            <p className="text-sm font-medium text-amber-600">
              Only {selectedVariant.stock} left in this option
            </p>
          ) : null}
        </div>
      ) : null}

      {minimumOrderQuantity > 1 ? (
        <div className="mb-5">
          <p className="text-sm font-semibold text-neutral-900">Quantity</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(minimumOrderQuantity, q - 1))}
              disabled={quantity <= minimumOrderQuantity}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 disabled:opacity-40"
            >
              −
            </button>
            <span className="min-w-[2rem] text-center text-sm font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700"
            >
              +
            </button>
            <span className="text-xs text-neutral-500">Min {minimumOrderQuantity}</span>
          </div>
        </div>
      ) : null}

      <div className="flex gap-3">
        <Button
          size="lg"
          disabled={!inStock}
          className={cn(
            "flex-1 rounded-full",
            showCartSuccess && "border-brand bg-brand hover:bg-brand",
            justAdded && "animate-action-success",
          )}
          onClick={handleAddToCart}
        >
          {!inStock ? (
            "Out of stock"
          ) : showCartSuccess ? (
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
            isFavorite(slug) && "border-brand bg-brand/10",
            pickerOpen && "ring-2 ring-brand ring-offset-2",
          )}
          onClick={() => setPickerOpen(true)}
          aria-label={isFavorite(slug) ? "Manage wishlist lists" : "Save to wishlist"}
          aria-expanded={pickerOpen}
          aria-haspopup="dialog"
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors duration-200",
              isFavorite(slug) ? "fill-brand text-brand" : "text-neutral-600",
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
    </div>
  );
}
