"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartProvider";
import { cn } from "@/lib/utils/cn";
import type { CartItem } from "@/types/cart";

type CartPayload = Omit<CartItem, "id" | "quantity"> & { quantity?: number };

interface AddToCartButtonProps {
  item: CartPayload;
  className?: string;
  variant?: "compact" | "button";
  label?: string;
}

export function AddToCartButton({
  item,
  className,
  variant = "compact",
  label = "Add",
}: AddToCartButtonProps) {
  const { addItem, removeItem, isInCart, items } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  const inCart = isInCart(item.slug ?? "", item.variantId);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const existing = items.find(
      (i) =>
        i.slug === item.slug && (i.variantId ?? "") === (item.variantId ?? ""),
    );

    if (existing) {
      removeItem(existing.id);
      setJustAdded(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      return;
    }

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
            <ShoppingBag className="h-3.5 w-3.5" />
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
        inCart ? `Remove ${item.name} from cart` : `Add ${item.name} to cart`
      }
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-md border-2 border-black px-2.5 text-[10px] font-extrabold uppercase tracking-wide shadow-[2px_2px_0_0_#000] transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_#000]",
        showSuccess
          ? "bg-brand text-white"
          : "bg-white text-black hover:bg-brand hover:text-white",
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
          <ShoppingBag className="h-3.5 w-3.5" strokeWidth={2.25} />
          {label}
        </>
      )}
    </button>
  );
}
