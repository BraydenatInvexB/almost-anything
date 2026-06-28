import type { FavoriteItem, WishlistsState } from "@/types/cart";

const STORAGE_KEY = "aa_wishlists";
const LEGACY_KEY = "aa_favorites";

export function generateListId(): string {
  return `list_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createDefaultState(): WishlistsState {
  const listId = generateListId();
  return {
    lists: [
      {
        id: listId,
        name: "My Wishlist",
        createdAt: new Date().toISOString(),
      },
    ],
    items: {},
    membership: { [listId]: [] },
    defaultListId: listId,
  };
}

function migrateFromLegacy(items: FavoriteItem[]): WishlistsState {
  const state = createDefaultState();
  const listId = state.defaultListId;

  for (const item of items) {
    state.items[item.slug] = item;
    state.membership[listId].push(item.slug);
  }

  return state;
}

export function loadWishlists(): WishlistsState {
  if (typeof window === "undefined") return createDefaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WishlistsState;
      if (parsed.lists?.length && parsed.defaultListId) return parsed;
    }

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const items = JSON.parse(legacy) as FavoriteItem[];
      const migrated = migrateFromLegacy(Array.isArray(items) ? items : []);
      saveWishlists(migrated);
      localStorage.removeItem(LEGACY_KEY);
      return migrated;
    }
  } catch {
    /* fall through */
  }

  return createDefaultState();
}

export function saveWishlists(state: WishlistsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getUniqueSlugs(state: WishlistsState): string[] {
  return [...new Set(Object.values(state.membership).flat())];
}

export function getListItems(state: WishlistsState, listId: string): FavoriteItem[] {
  const slugs = state.membership[listId] ?? [];
  return slugs.map((slug) => state.items[slug]).filter(Boolean);
}

export function isInList(state: WishlistsState, listId: string, slug: string): boolean {
  return (state.membership[listId] ?? []).includes(slug);
}

export function isInAnyList(state: WishlistsState, slug: string): boolean {
  return getUniqueSlugs(state).includes(slug);
}
