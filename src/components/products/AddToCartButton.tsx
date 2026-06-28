"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartProvider";
import { cn } from "@/lib/utils/cn";
import type { CartItem } from "@/types/cart";

type CartPayload = Omit<CartItem, "id" | "quantity"> & { quantity?: number };

interface AddToCartButtonProps {
  item: CartPayload;
  className?: string;
  icon?: "plus" | "bag";
  variant?: "icon" | "button";
  label?: string;
}

export function AddToCartButton({
  item,
  className,
  icon = "plus",
  variant = "icon",
  label = "Add to Cart",
}: AddToCartButtonProps) {
  const { addItem, isInCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const Icon = icon === "bag" ? ShoppingBag : Plus;
  const inCart = isInCart(item.slug ?? "");

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addItem(item);
    setJustAdded(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setJustAdded(false), 1400);
  }

  const showSuccess = justAdded || inCart;

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-black px-4 py-2 text-sm font-extrabold uppercase text-white shadow-[3px_3px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#000]",
          showSuccess
            ? "bg-brand hover:bg-brand"
            : "bg-black hover:bg-brand",
          justAdded && "animate-action-success",
          className,
        )}
      >
        {showSuccess ? (
          <>
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
            {justAdded ? "Added" : "In cart"}
          </>
        ) : (
          <>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        showSuccess ? `${item.name} in cart` : `Add ${item.name} to cart`
      }
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black text-white transition-colors",
        showSuccess ? "bg-brand" : "bg-black hover:bg-brand",
        justAdded && "animate-action-success",
        className,
      )}
    >
      {showSuccess ? (
        <Check className="h-4 w-4" strokeWidth={3} />
      ) : (
        <Icon className="h-4 w-4" />
      )}
    </button>
  );
}
