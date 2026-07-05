"use client";

import { useCallback } from "react";
import type { FavoriteItem, WishlistsState } from "@/types/cart";
import { useFeedback } from "@/context/FeedbackProvider";
import {
  generateListId,
  getUniqueSlugs,
  isInAnyList,
} from "@/lib/wishlist/storage";

export function useWishlistMutations(
  state: WishlistsState,
  setState: React.Dispatch<React.SetStateAction<WishlistsState>>,
) {
  const { pulseWishlist } = useFeedback();

  const update = useCallback((fn: (prev: WishlistsState) => WishlistsState) => {
    setState(fn);
  }, [setState]);

  const addToList = useCallback(
    (listId: string, item: FavoriteItem) => {
      let added = false;
      update((prev) => {
        const list = prev.lists.find((l) => l.id === listId);
        if (!list) return prev;

        const slugs = prev.membership[listId] ?? [];
        if (slugs.includes(item.slug)) return prev;

        added = true;
        return {
          ...prev,
          items: { ...prev.items, [item.slug]: item },
          membership: {
            ...prev.membership,
            [listId]: [...slugs, item.slug],
          },
        };
      });
      if (added) pulseWishlist();
    },
    [pulseWishlist, update],
  );

  const removeFromList = useCallback(
    (listId: string, slug: string) => {
      let removed = false;
      update((prev) => {
        const slugs = (prev.membership[listId] ?? []).filter((s) => s !== slug);
        if (slugs.length === (prev.membership[listId] ?? []).length) return prev;
        removed = true;

        const membership = { ...prev.membership, [listId]: slugs };
        const stillUsed = getUniqueSlugs({ ...prev, membership }).includes(slug);
        const items = stillUsed
          ? prev.items
          : Object.fromEntries(Object.entries(prev.items).filter(([key]) => key !== slug));

        return { ...prev, membership, items };
      });
      if (removed) pulseWishlist();
    },
    [pulseWishlist, update],
  );

  const removeFromAllLists = useCallback(
    (slug: string) => {
      update((prev) => {
        const membership = Object.fromEntries(
          Object.entries(prev.membership).map(([id, slugs]) => [
            id,
            slugs.filter((s) => s !== slug),
          ]),
        );
        const items = Object.fromEntries(
          Object.entries(prev.items).filter(([key]) => key !== slug),
        );
        return { ...prev, membership, items };
      });
    },
    [update],
  );

  const createList = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return "";

      const id = generateListId();
      update((prev) => ({
        ...prev,
        lists: [...prev.lists, { id, name: trimmed, createdAt: new Date().toISOString() }],
        membership: { ...prev.membership, [id]: [] },
      }));
      return id;
    },
    [update],
  );

  const createListAndAdd = useCallback(
    (name: string, item: FavoriteItem) => {
      const trimmed = name.trim();
      if (!trimmed) return "";

      const id = generateListId();
      update((prev) => {
        const slugs = prev.membership[id] ?? [];
        const alreadyInNewList = slugs.includes(item.slug);

        return {
          ...prev,
          lists: [...prev.lists, { id, name: trimmed, createdAt: new Date().toISOString() }],
          items: { ...prev.items, [item.slug]: item },
          membership: {
            ...prev.membership,
            [id]: alreadyInNewList ? slugs : [...slugs, item.slug],
          },
        };
      });
      pulseWishlist();
      return id;
    },
    [pulseWishlist, update],
  );

  const renameList = useCallback(
    (listId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      update((prev) => ({
        ...prev,
        lists: prev.lists.map((l) => (l.id === listId ? { ...l, name: trimmed } : l)),
      }));
    },
    [update],
  );

  const deleteList = useCallback(
    (listId: string) => {
      update((prev) => {
        if (prev.lists.length <= 1) return prev;

        const membership = { ...prev.membership };
        delete membership[listId];

        const remainingSlugs = new Set(getUniqueSlugs({ ...prev, membership }));
        const items = Object.fromEntries(
          Object.entries(prev.items).filter(([slug]) => remainingSlugs.has(slug)),
        );

        const lists = prev.lists.filter((l) => l.id !== listId);
        const defaultListId =
          prev.defaultListId === listId ? lists[0].id : prev.defaultListId;

        return { lists, membership, items, defaultListId };
      });
    },
    [update],
  );

  const setDefaultList = useCallback(
    (listId: string) => {
      update((prev) => {
        if (!prev.lists.some((l) => l.id === listId)) return prev;
        return { ...prev, defaultListId: listId };
      });
    },
    [update],
  );

  const toggleFavorite = useCallback(
    (item: FavoriteItem) => {
      if (isInAnyList(state, item.slug)) {
        removeFromAllLists(item.slug);
      } else {
        addToList(state.defaultListId, item);
      }
    },
    [addToList, removeFromAllLists, state],
  );

  return {
    addToList,
    removeFromList,
    removeFromAllLists,
    createList,
    createListAndAdd,
    renameList,
    deleteList,
    setDefaultList,
    toggleFavorite,
    removeFavorite: removeFromAllLists,
  };
}
