"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Heart, Plus, X } from "lucide-react";
import { useFavorites } from "@/context/FavoritesProvider";
import { cn } from "@/lib/utils/cn";
import type { FavoriteItem } from "@/types/cart";

const PANEL_WIDTH = 288;
const PANEL_HEIGHT_ESTIMATE = 320;

interface WishlistPickerProps {
  product: FavoriteItem;
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

function computePosition(anchor: HTMLElement) {
  const rect = anchor.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const openAbove = spaceBelow < PANEL_HEIGHT_ESTIMATE && rect.top > PANEL_HEIGHT_ESTIMATE;

  let left = rect.right - PANEL_WIDTH;
  left = Math.max(12, Math.min(left, window.innerWidth - PANEL_WIDTH - 12));

  const top = openAbove ? rect.top - 8 : rect.bottom + 8;

  return { top, left, openAbove };
}

export function WishlistPicker({ product, open, onClose, anchorRef }: WishlistPickerProps) {
  const {
    lists,
    isInList,
    addToList,
    removeFromList,
    createListAndAdd,
  } = useFavorites();

  const panelRef = useRef<HTMLDivElement>(null);
  const [newListName, setNewListName] = useState("");
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    openAbove: boolean;
  } | null>(null);

  const closePicker = useCallback(() => {
    setNewListName("");
    onClose();
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setPosition(null);
      return;
    }

    function updatePosition() {
      if (!anchorRef.current) return;
      setPosition(computePosition(anchorRef.current));
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }
      closePicker();
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePicker();
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
    }, 0);

    document.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, anchorRef, closePicker]);

  function toggleList(listId: string) {
    if (isInList(listId, product.slug)) {
      removeFromList(listId, product.slug);
    } else {
      addToList(listId, product);
    }
  }

  function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    const name = newListName.trim();
    if (!name) return;

    createListAndAdd(name, product);
    setNewListName("");
  }

  if (!open || !position) return null;

  const panel = (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Save to wishlist"
      className={cn(
        "fixed z-[300] w-[288px] rounded-xl border-2 border-black bg-white shadow-[4px_4px_0_0_#000]",
        position.openAbove ? "-translate-y-full" : "",
      )}
      style={{ top: position.top, left: position.left }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 fill-brand text-brand" />
          <p className="text-xs font-bold uppercase tracking-wide text-black">
            Save to list
          </p>
        </div>
        <button
          type="button"
          onClick={closePicker}
          className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-black"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ul className="max-h-48 space-y-0.5 overflow-y-auto p-2">
        {lists.map((list) => {
          const saved = isInList(list.id, product.slug);
          return (
            <li key={list.id}>
              <button
                type="button"
                onClick={() => toggleList(list.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  saved
                    ? "bg-brand/10 text-black"
                    : "text-neutral-700 hover:bg-neutral-50",
                )}
              >
                <span className="truncate">{list.name}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    saved
                      ? "border-brand bg-brand text-white"
                      : "border-neutral-300 bg-white",
                  )}
                >
                  {saved ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={handleCreateList}
        className="flex gap-1.5 border-t border-neutral-200 p-2"
      >
        <input
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
          placeholder="New list name"
          className="h-9 min-w-0 flex-1 rounded-lg border border-neutral-300 px-2.5 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-black"
        />
        <button
          type="submit"
          disabled={!newListName.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-black text-white transition-colors hover:bg-brand disabled:opacity-40"
          aria-label="Create list"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>

      <div className="border-t border-neutral-200 px-2 pb-2">
        <button
          type="button"
          onClick={closePicker}
          className="w-full rounded-lg py-2 text-xs font-bold uppercase tracking-wide text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-black"
        >
          Done
        </button>
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
