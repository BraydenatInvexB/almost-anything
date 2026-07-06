"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/admin/ui";
import { flagsFromProduct } from "@/components/admin/StorefrontSectionToggles";
import type { StorefrontSectionFlags } from "@/config/storefront-sections";
import { storefrontSectionPatch } from "@/lib/product/deal-flags";
import type { Product } from "@/types/database";
import {
  ProductsManagerRow,
} from "@/components/admin/ProductsManagerRow";
import type { ProductsManagerDeleteState, ProductsManagerSaveState } from "@/components/admin/products-manager-utils";

interface Props {
  products: Product[];
  canEditMarkup: boolean;
  canEdit?: boolean;
  minMarkup: number;
  maxMarkup: number;
  initialQuery?: string;
}

export function ProductsManager({
  products,
  canEditMarkup,
  canEdit,
  minMarkup,
  maxMarkup,
  initialQuery = "",
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState(products);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("all");
  const [markups, setMarkups] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.id, Number(p.markup_percent)])),
  );
  const [retailPrices, setRetailPrices] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.id, Number(p.retail_price)])),
  );
  const [saveState, setSaveState] = useState<Record<string, ProductsManagerSaveState>>({});
  const [deleteState, setDeleteState] = useState<Record<string, ProductsManagerDeleteState>>({});
  const [sections, setSections] = useState<Record<string, StorefrontSectionFlags>>(
    Object.fromEntries(items.map((p) => [p.id, flagsFromProduct(p)])),
  );
  const [sectionSaving, setSectionSaving] = useState<Record<string, boolean>>({});

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(items.map((p) => p.category)))],
    [items],
  );

  const filtered = items.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCat = category === "all" || p.category === category;
    return matchesQuery && matchesCat;
  });

  function setMarkup(id: string, value: number, basePrice: number) {
    const clamped = Math.min(maxMarkup, Math.max(minMarkup, value));
    setMarkups((m) => ({ ...m, [id]: clamped }));
    setRetailPrices((r) => ({
      ...r,
      [id]: Number((basePrice * (1 + clamped / 100)).toFixed(2)),
    }));
    setSaveState((s) => ({ ...s, [id]: "idle" }));
  }

  async function save(product: Product) {
    const markup = markups[product.id];
    const retail = retailPrices[product.id] ?? product.retail_price;
    setSaveState((s) => ({ ...s, [product.id]: "saving" }));
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          markup_percent: markup,
          retail_price: retail,
        }),
      });
      if (res.ok) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? { ...p, markup_percent: markup, retail_price: retail }
              : p,
          ),
        );
      }
    } catch {
      /* demo mode tolerates failures */
    }
    setSaveState((s) => ({ ...s, [product.id]: "saved" }));
    setTimeout(() => setSaveState((s) => ({ ...s, [product.id]: "idle" })), 2000);
  }

  async function remove(product: Product) {
    const confirmed = window.confirm(
      `Remove "${product.name}" from the catalog? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeleteState((s) => ({ ...s, [product.id]: "deleting" }));
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(json.error ?? "Could not remove product");
        setDeleteState((s) => ({ ...s, [product.id]: "idle" }));
        return;
      }
      setItems((prev) => prev.filter((p) => p.id !== product.id));
      router.refresh();
    } catch {
      window.alert("Network error — product was not removed");
      setDeleteState((s) => ({ ...s, [product.id]: "idle" }));
    }
  }

  async function updateSections(product: Product, next: StorefrontSectionFlags) {
    setSections((s) => ({ ...s, [product.id]: next }));
    if (!canEdit) return;

    setSectionSaving((s) => ({ ...s, [product.id]: true }));
    try {
      const patch = storefrontSectionPatch(product, next);
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, ...patch }),
      });
      if (!res.ok) {
        setSections((s) => ({ ...s, [product.id]: flagsFromProduct(product) }));
      } else {
        setItems((prev) =>
          prev.map((p) =>
            p.id === product.id
              ? { ...p, ...patch, show_in_steals: patch.show_in_steals, is_deal: patch.is_deal ?? p.is_deal }
              : p,
          ),
        );
        router.refresh();
      }
    } catch {
      setSections((s) => ({ ...s, [product.id]: flagsFromProduct(product) }));
    } finally {
      setSectionSaving((s) => ({ ...s, [product.id]: false }));
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="h-9 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm focus:border-neutral-300 focus:bg-white focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-full border border-neutral-200 bg-white px-4 text-sm capitalize focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All categories" : c}
            </option>
          ))}
        </select>
      </div>

      <p className="border-b border-neutral-100 px-4 pb-3 text-xs text-neutral-500">
        Toggle <span className="font-semibold text-neutral-700">Deals</span> on a product to show it on the homepage
        and the <span className="font-semibold text-neutral-700">Today&apos;s Deals</span> page. Edit a product to set
        was/now pricing for discount badges.
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title={query || category !== "all" ? "No products match your filters" : "No products yet"}
          description={
            query || category !== "all"
              ? "Try a different search term or category."
              : "Add products from the catalog or import your inventory."
          }
        />
      ) : (
        <div className="overflow-x-hidden">
          <table className="w-full table-fixed text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80">
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Product
                </th>
                <th className="hidden w-[72px] px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 sm:table-cell">
                  Cost
                </th>
                <th className="w-[88px] px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Markup
                </th>
                <th className="hidden w-[80px] px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 md:table-cell">
                  Retail
                </th>
                <th className="hidden w-[72px] px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 lg:table-cell">
                  Stock
                </th>
                <th className="hidden w-[120px] px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 lg:table-cell">
                  Homepage & deals
                </th>
                {(canEditMarkup || canEdit) && (
                  <th className="w-[96px] px-2 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((p) => {
                const markup = markups[p.id] ?? Number(p.markup_percent);
                const retail =
                  retailPrices[p.id] ??
                  Number((p.base_price * (1 + markup / 100)).toFixed(2));

                return (
                  <ProductsManagerRow
                    key={p.id}
                    product={p}
                    markup={markup}
                    retail={retail}
                    saveState={saveState[p.id] ?? "idle"}
                    deleteState={deleteState[p.id] ?? "idle"}
                    sections={sections[p.id] ?? flagsFromProduct(p)}
                    sectionSaving={sectionSaving[p.id] ?? false}
                    canEditMarkup={canEditMarkup}
                    canEdit={canEdit}
                    onSetMarkup={setMarkup}
                    onSave={save}
                    onRemove={remove}
                    onUpdateSections={updateSections}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
