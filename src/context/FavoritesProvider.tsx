"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FavoriteItem, WishlistsState } from "@/types/cart";
import { useWishlistMutations } from "@/context/favorites-mutations";
import {
  createDefaultState,
  getListItems,
  getUniqueSlugs,
  isInAnyList,
  isInList,
  loadWishlists,
  saveWishlists,
} from "@/lib/wishlist/storage";

interface FavoritesContextValue {
  lists: WishlistsState["lists"];
  defaultListId: string;
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
  toggleFavorite: (item: FavoriteItem) => void;
  removeFavorite: (slug: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function buildFavoritesArray(state: WishlistsState): FavoriteItem[] {
  return getUniqueSlugs(state)
    .map((slug) => state.items[slug])
    .filter(Boolean);
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
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

  const mutations = useWishlistMutations(state, setState);

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
      ...mutations,
    }),
    [
      state.lists,
      state.defaultListId,
      favorites,
      favoriteCount,
      getItemsForList,
      checkIsFavorite,
      checkIsInList,
      mutations,
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
