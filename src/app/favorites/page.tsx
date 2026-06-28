"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Plus, Star, Trash2, Pencil, Check, X } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { useFavorites } from "@/context/FavoritesProvider";
import { formatCurrency, formatRating } from "@/lib/utils/cn";
import { cn } from "@/lib/utils/cn";

export default function FavoritesPage() {
  const {
    lists,
    favoriteCount,
    getItemsForList,
    createList,
    renameList,
    deleteList,
    removeFromList,
  } = useFavorites();

  const [activeListId, setActiveListId] = useState(lists[0]?.id ?? "");
  const [newListName, setNewListName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const activeId =
    lists.some((l) => l.id === activeListId) ? activeListId : (lists[0]?.id ?? "");
  const activeList = lists.find((l) => l.id === activeId);
  const items = activeId ? getItemsForList(activeId) : [];

  function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    const id = createList(newListName);
    if (id) {
      setActiveListId(id);
      setNewListName("");
    }
  }

  function startRename(listId: string, name: string) {
    setEditingId(listId);
    setEditName(name);
  }

  function saveRename(listId: string) {
    renameList(listId, editName);
    setEditingId(null);
    setEditName("");
  }

  function handleDeleteList(listId: string) {
    if (lists.length <= 1) return;
    deleteList(listId);
    if (activeId === listId) {
      const remaining = lists.filter((l) => l.id !== listId);
      setActiveListId(remaining[0]?.id ?? "");
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-black">
              Wishlists
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              {favoriteCount} saved {favoriteCount === 1 ? "item" : "items"} across{" "}
              {lists.length} {lists.length === 1 ? "list" : "lists"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* Lists sidebar */}
          <aside className="lg:w-72 lg:shrink-0">
            <Card variant="elevated" className="bg-white p-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-neutral-500">
                Your lists
              </p>
              <ul className="mt-3 space-y-1.5">
                {lists.map((list) => {
                  const count = getItemsForList(list.id).length;
                  const isActive = list.id === activeId;
                  const isEditing = editingId === list.id;

                  return (
                    <li key={list.id}>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-9 min-w-0 flex-1 rounded-lg border-2 border-black px-2 text-sm font-semibold outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => saveRename(list.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-brand text-white"
                            aria-label="Save name"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-black bg-white"
                            aria-label="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveListId(list.id)}
                            className={cn(
                              "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-bold transition-colors",
                              isActive
                                ? "border-black bg-brand text-white"
                                : "border-transparent bg-neutral-50 text-black hover:border-black",
                            )}
                          >
                            <span className="truncate">{list.name}</span>
                            <span
                              className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                                isActive ? "bg-white/20 text-white" : "bg-white text-neutral-600",
                              )}
                            >
                              {count}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startRename(list.id, list.name)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white text-neutral-600 hover:bg-neutral-50"
                            aria-label={`Rename ${list.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {lists.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteList(list.id)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white text-red-600 hover:bg-red-50"
                              aria-label={`Delete ${list.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              <form onSubmit={handleCreateList} className="mt-4 flex gap-1.5 border-t border-neutral-100 pt-4">
                <input
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="New list name"
                  className="h-10 min-w-0 flex-1 rounded-lg border-2 border-black px-3 text-sm font-medium outline-none placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={!newListName.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-black text-white hover:bg-brand disabled:opacity-40"
                  aria-label="Create list"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </Card>
          </aside>

          {/* List items */}
          <div className="min-w-0 flex-1">
            {favoriteCount === 0 ? (
              <Card variant="elevated" className="bg-white py-16 text-center">
                <Heart className="mx-auto h-12 w-12 text-neutral-300" />
                <p className="mt-4 font-medium">No saved items yet</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Tap the heart on any product and pick a list to save it to.
                </p>
                <Link href="/products" className="mt-6 inline-block">
                  <Button>Browse Products</Button>
                </Link>
              </Card>
            ) : items.length === 0 ? (
              <Card variant="elevated" className="bg-white py-16 text-center">
                <p className="font-medium">{activeList?.name} is empty</p>
                <p className="mt-2 text-sm text-neutral-500">
                  Save products to this list from the store.
                </p>
                <Link href="/products" className="mt-6 inline-block">
                  <Button>Browse Products</Button>
                </Link>
              </Card>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-black uppercase tracking-tight text-black">
                  {activeList?.name}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Card
                      key={`${activeId}-${item.slug}`}
                      variant="elevated"
                      padding="none"
                      className="overflow-hidden bg-white"
                    >
                      <Link href={`/products/${item.slug}`}>
                        <div className="relative aspect-[4/3] bg-neutral-100">
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="300px"
                          />
                        </div>
                      </Link>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/products/${item.slug}`}
                              className="font-medium hover:underline"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 font-semibold">
                              {formatCurrency(item.price, item.currency)}
                            </p>
                          </div>
                          <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {formatRating(item.rating)}
                          </span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <AddToCartButton
                            variant="button"
                            item={{
                              type: "product",
                              slug: item.slug,
                              name: item.name,
                              price: item.price,
                              currency: item.currency,
                              imageUrl: item.imageUrl,
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-red-500"
                            onClick={() => removeFromList(activeId, item.slug)}
                            aria-label={`Remove from ${activeList?.name}`}
                          >
                            <Heart className="h-4 w-4 fill-current" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
