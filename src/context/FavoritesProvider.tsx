"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FavoriteItem, WishlistList, WishlistsState } from "@/types/cart";
import { useFeedback } from "@/context/FeedbackProvider";
import {
  createDefaultState,
  generateListId,
  getListItems,
  getUniqueSlugs,
  isInAnyList,
  isInList,
  loadWishlists,
  saveWishlists,
} from "@/lib/wishlist/storage";

interface FavoritesContextValue {
  lists: WishlistList[];
  defaultListId: string;
  /** Unique saved items across all lists (for header count). */
  favorites: FavoriteItem[];
  favoriteCount: number;
  getItemsForList: (listId: string) => FavoriteItem[];
  isFavorite: (slug: string) => boolean;
  isInList: (listId: string, slug: string) => boolean;
  addToList: (listId: string, item: FavoriteItem) => void;
  removeFromList: (listId: string, slug: string) => void;
  removeFromAllLists: (slug: string) => void;
  createList: (name: string) => string;
  createListAndAdd: (name: string, item: FavoriteItem) => string;
  renameList: (listId: string, name: string) => void;
  deleteList: (listId: string) => void;
  setDefaultList: (listId: string) => void;
  /** @deprecated Use addToList / removeFromAllLists via WishlistPicker */
  toggleFavorite: (item: FavoriteItem) => void;
  /** @deprecated Use removeFromList or removeFromAllLists */
  removeFavorite: (slug: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function buildFavoritesArray(state: WishlistsState): FavoriteItem[] {
  return getUniqueSlugs(state)
    .map((slug) => state.items[slug])
    .filter(Boolean);
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { pulseWishlist } = useFeedback();
  const [state, setState] = useState<WishlistsState>(createDefaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate wishlists from localStorage after mount */
    setState(loadWishlists());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (hydrated) saveWishlists(state);
  }, [state, hydrated]);

  const update = useCallback((fn: (prev: WishlistsState) => WishlistsState) => {
    setState(fn);
  }, []);

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
          : Object.fromEntries(
              Object.entries(prev.items).filter(([key]) => key !== slug),
            );

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
        lists: [
          ...prev.lists,
          { id, name: trimmed, createdAt: new Date().toISOString() },
        ],
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
          lists: [
            ...prev.lists,
            { id, name: trimmed, createdAt: new Date().toISOString() },
          ],
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
        lists: prev.lists.map((l) =>
          l.id === listId ? { ...l, name: trimmed } : l,
        ),
      }));
    },
    [update],
  );

  const deleteList = useCallback(
    (listId: string) => {
      update((prev) => {
        if (prev.lists.length <= 1) return prev;

        const slugsInList = prev.membership[listId] ?? [];
        const membership = { ...prev.membership };
        delete membership[listId];

        const remainingSlugs = new Set(getUniqueSlugs({ ...prev, membership }));
        const items = Object.fromEntries(
          Object.entries(prev.items).filter(([slug]) => remainingSlugs.has(slug)),
        );

        const lists = prev.lists.filter((l) => l.id !== listId);
        const defaultListId =
          prev.defaultListId === listId ? lists[0].id : prev.defaultListId;

        // Drop orphaned slugs only in deleted list
        void slugsInList;

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

  const removeFavorite = removeFromAllLists;

  const favorites = useMemo(() => buildFavoritesArray(state), [state]);
  const favoriteCount = favorites.length;

  const getItemsForList = useCallback(
    (listId: string) => getListItems(state, listId),
    [state],
  );

  const checkIsFavorite = useCallback(
    (slug: string) => isInAnyList(state, slug),
    [state],
  );

  const checkIsInList = useCallback(
    (listId: string, slug: string) => isInList(state, listId, slug),
    [state],
  );

  const value = useMemo(
    () => ({
      lists: state.lists,
      defaultListId: state.defaultListId,
      favorites,
      favoriteCount,
      getItemsForList,
      isFavorite: checkIsFavorite,
      isInList: checkIsInList,
      addToList,
      removeFromList,
      removeFromAllLists,
      createList,
      createListAndAdd,
      renameList,
      deleteList,
      setDefaultList,
      toggleFavorite,
      removeFavorite,
    }),
    [
      state.lists,
      state.defaultListId,
      favorites,
      favoriteCount,
      getItemsForList,
      checkIsFavorite,
      checkIsInList,
      addToList,
      removeFromList,
      removeFromAllLists,
      createList,
      createListAndAdd,
      renameList,
      deleteList,
      setDefaultList,
      toggleFavorite,
      removeFavorite,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
