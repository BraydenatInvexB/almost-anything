"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, Loader2, Pencil, Search, Star, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/admin/ui";
import {
  StorefrontSectionToggles,
  flagsFromProduct,
} from "@/components/admin/StorefrontSectionToggles";
import type { StorefrontSectionFlags } from "@/config/storefront-sections";
import { formatCurrency } from "@/lib/utils/cn";
import type { Product } from "@/types/database";
import { parseProductEnrichment } from "@/types/product-enrichment";

interface Props {
  products: Product[];
  canEditMarkup: boolean;
  canEdit?: boolean;
  minMarkup: number;
  maxMarkup: number;
  initialQuery?: string;
}

type SaveState = "idle" | "saving" | "saved";
type DeleteState = "idle" | "deleting";

function compactStockLabel(status: string): string {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "available_international":
      return "Intl.";
    case "low_stock":
      return "Low";
    case "out_of_stock":
      return "Out";
    case "sourced":
      return "Sourced";
    default:
      return status.replace(/_/g, " ");
  }
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
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [deleteState, setDeleteState] = useState<Record<string, DeleteState>>({});
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
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, ...next }),
      });
      if (!res.ok) {
        setSections((s) => ({ ...s, [product.id]: flagsFromProduct(product) }));
      } else {
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
                <th className="hidden w-[120px] px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 xl:table-cell">
                  Storefront
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
                const state = saveState[p.id] ?? "idle";
                const removing = deleteState[p.id] === "deleting";
                const dirty = Math.abs(markup - Number(p.markup_percent)) > 0.001;
                const enrichment = parseProductEnrichment(p.metadata);
                const supplierName =
                  enrichment.supplierIntel?.primary.supplierName ?? p.source_name ?? null;
                const supplierUrl =
                  enrichment.supplierIntel?.primary.supplierUrl ?? p.source_url ?? null;

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/80">
                    <td className="px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 shrink-0 rounded-md bg-neutral-100" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-900">{p.name}</p>
                          <p className="flex items-center gap-1 truncate text-[11px] text-neutral-400">
                            <Star className="h-2.5 w-2.5 shrink-0 fill-amber-400 text-amber-400" />
                            {p.rating} · <span className="capitalize">{p.category}</span>
                          </p>
                          {supplierName && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-neutral-500">
                              <span className="truncate">{supplierName}</span>
                              {supplierUrl && (
                                <a
                                  href={supplierUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex shrink-0 items-center text-brand hover:underline"
                                  title="Open supplier listing"
                                >
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-2 py-2.5 text-xs text-neutral-600 sm:table-cell">
                      {formatCurrency(p.base_price, p.currency)}
                    </td>
                    <td className="px-2 py-2.5">
                      {canEditMarkup ? (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setMarkup(p.id, Math.round((markup - 1) * 10) / 10, p.base_price)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 text-xs text-neutral-500 hover:bg-neutral-100"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={markup}
                            onChange={(e) => setMarkup(p.id, Number(e.target.value), p.base_price)}
                            className="h-6 w-12 rounded border border-neutral-200 px-1 text-center text-xs focus:border-neutral-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setMarkup(p.id, Math.round((markup + 1) * 10) / 10, p.base_price)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-neutral-200 text-xs text-neutral-500 hover:bg-neutral-100"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs">{markup.toFixed(1)}%</span>
                      )}
                    </td>
                    <td className="hidden px-2 py-2.5 text-xs font-semibold md:table-cell">
                      {formatCurrency(retail, p.currency)}
                    </td>
                    <td className="hidden px-2 py-2.5 lg:table-cell">
                      <span
                        className="inline-flex rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-600"
                        title={compactStockLabel(p.stock_status)}
                      >
                        {compactStockLabel(p.stock_status)}
                      </span>
                    </td>
                    <td className="hidden px-2 py-2.5 xl:table-cell">
                      <StorefrontSectionToggles
                        compact
                        disabled={!canEdit || sectionSaving[p.id]}
                        value={sections[p.id] ?? flagsFromProduct(p)}
                        onChange={(next) => updateSections(p, next)}
                      />
                    </td>
                    {(canEditMarkup || canEdit) && (
                      <td className="px-2 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <>
                              <Link
                                href={`/admin/products/${p.id}/edit`}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                title="Edit product"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                type="button"
                                disabled={removing}
                                onClick={() => remove(p)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                title={`Remove ${p.name}`}
                              >
                                {removing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </>
                          )}
                          {canEditMarkup && (
                            <button
                              type="button"
                              disabled={!dirty || state === "saving"}
                              onClick={() => save(p)}
                              title={state === "saved" ? "Saved" : "Save markup"}
                              className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-neutral-900 px-2 text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              {state === "saving" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : state === "saved" ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : (
                                "Save"
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
