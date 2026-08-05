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
  disabled?: boolean;
}

export function AddToCartButton({
  item,
  className,
  variant = "compact",
  label = "Add",
  disabled = false,
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
    if (disabled) return;

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
        disabled={disabled}
        className={cn(
          "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]",
          disabled && "cursor-not-allowed opacity-40",
          showSuccess ? "bg-brand hover:bg-[#c80511]" : "bg-neutral-900 hover:bg-brand",
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
      disabled={disabled}
      aria-label={
        disabled
          ? `${item.name} — price on request`
          : inCart
            ? `Remove ${item.name} from cart`
            : `Add ${item.name} to cart`
      }
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[11px] font-semibold tracking-tight shadow-sm transition-all",
        disabled && "cursor-not-allowed opacity-40",
        showSuccess
          ? "bg-brand text-white hover:bg-[#c80511]"
          : "border border-neutral-200 bg-white text-neutral-800 hover:border-brand hover:text-brand",
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
