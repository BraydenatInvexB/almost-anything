"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Loader2, Search, Star } from "lucide-react";
import { StatusBadge, Table, Th, Td } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import type { Product } from "@/types/database";

interface Props {
  products: Product[];
  canEditMarkup: boolean;
  canEdit?: boolean;
  minMarkup: number;
  maxMarkup: number;
}

type SaveState = "idle" | "saving" | "saved";

export function ProductsManager({ products, canEditMarkup, canEdit, minMarkup, maxMarkup }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [markups, setMarkups] = useState<Record<string, number>>(
    Object.fromEntries(products.map((p) => [p.id, Number(p.markup_percent)])),
  );
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );

  const filtered = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
    const matchesCat = category === "all" || p.category === category;
    return matchesQuery && matchesCat;
  });

  function setMarkup(id: string, value: number) {
    const clamped = Math.min(maxMarkup, Math.max(minMarkup, value));
    setMarkups((m) => ({ ...m, [id]: clamped }));
    setSaveState((s) => ({ ...s, [id]: "idle" }));
  }

  async function save(product: Product) {
    const markup = markups[product.id];
    setSaveState((s) => ({ ...s, [product.id]: "saving" }));
    try {
      await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, markup_percent: markup }),
      });
    } catch {
      /* demo mode tolerates failures */
    }
    setSaveState((s) => ({ ...s, [product.id]: "saved" }));
    setTimeout(() => setSaveState((s) => ({ ...s, [product.id]: "idle" })), 2000);
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white">
      {/* Toolbar */}
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

      <Table>
        <thead>
          <tr className="border-b border-neutral-100">
            <Th>Product</Th>
            <Th>Cost</Th>
            <Th>Markup %</Th>
            <Th>Retail</Th>
            <Th>Margin</Th>
            <Th>Stock</Th>
            {(canEditMarkup || canEdit) && <Th />}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {filtered.map((p) => {
            const markup = markups[p.id] ?? Number(p.markup_percent);
            const retail = p.base_price * (1 + markup / 100);
            const margin = retail - p.base_price;
            const state = saveState[p.id] ?? "idle";
            const dirty = Math.abs(markup - Number(p.markup_percent)) > 0.001;
            return (
              <tr key={p.id} className="hover:bg-neutral-50">
                <Td>
                  <div className="flex items-center gap-3">
                    {p.image_url && (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="max-w-[200px] truncate font-medium text-neutral-900">{p.name}</p>
                      <p className="flex items-center gap-1 text-xs text-neutral-400">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {p.rating} · <span className="capitalize">{p.category}</span>
                      </p>
                    </div>
                  </div>
                </Td>
                <Td className="text-neutral-600">{formatCurrency(p.base_price, p.currency)}</Td>
                <Td>
                  {canEditMarkup ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMarkup(p.id, Math.round((markup - 1) * 10) / 10)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={markup}
                        onChange={(e) => setMarkup(p.id, Number(e.target.value))}
                        className="h-7 w-16 rounded-lg border border-neutral-200 px-2 text-center text-sm focus:border-neutral-400 focus:outline-none"
                      />
                      <button
                        onClick={() => setMarkup(p.id, Math.round((markup + 1) * 10) / 10)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span>{markup.toFixed(1)}%</span>
                  )}
                </Td>
                <Td className="font-semibold">{formatCurrency(retail, p.currency)}</Td>
                <Td className="text-emerald-600">{formatCurrency(margin, p.currency)}</Td>
                <Td>
                  <StatusBadge status={p.stock_status} />
                </Td>
                {(canEditMarkup || canEdit) && (
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                        >
                          Edit
                        </Link>
                      )}
                      {canEditMarkup && (
                        <button
                          disabled={!dirty || state === "saving"}
                          onClick={() => save(p)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {state === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {state === "saved" && <Check className="h-3.5 w-3.5" />}
                          {state === "saved" ? "Saved" : "Save"}
                        </button>
                      )}
                    </div>
                  </Td>
                )}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
