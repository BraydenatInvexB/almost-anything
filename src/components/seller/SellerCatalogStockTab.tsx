"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { EmptyState, Table, Td, Th } from "@/components/admin/ui";
import { getStockLevel } from "@/lib/seller/stock-status";
import { SellerCatalogToolbar } from "@/components/seller/SellerCatalogToolbar";
import { SellerStockBadge } from "@/components/seller/SellerPanel";
import { ProductLocationInventoryField } from "@/components/product/ProductLocationInventoryField";
import {
  parseLocationInventory,
  totalLocationStock,
  type ProductLocationInventory,
} from "@/lib/product/location-inventory";
import type { SellerCatalogProduct } from "@/types/seller-catalog";

export function SellerCatalogStockTab({
  products,
  canManage,
  onUpdated,
}: {
  products: SellerCatalogProduct[];
  canManage: boolean;
  onUpdated: (productId: string, stockQuantity: number, metadata: unknown) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [adjusting, setAdjusting] = useState<SellerCatalogProduct | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    let list = products;
    if (filter === "low") {
      list = list.filter((p) => getStockLevel(Number(p.stock_quantity)) === "low");
    } else if (filter === "out") {
      list = list.filter((p) => getStockLevel(Number(p.stock_quantity)) === "out");
    }
    if (query.trim()) {
      const needle = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(needle) || p.slug.toLowerCase().includes(needle),
      );
    }
    return list;
  }, [products, filter, query]);

  async function patchStock(productId: string, stockLocations: ProductLocationInventory) {
    const stockQuantity = totalLocationStock(stockLocations);
    setSaving(true);
    try {
      const res = await fetch("/api/seller/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, stockLocations }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      onUpdated(productId, stockQuantity, data.product?.metadata);
      setAdjusting(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not update stock");
    } finally {
      setSaving(false);
    }
  }

  if (!products.length) {
    return (
      <EmptyState
        title="No stock to manage"
        description="Add products or import a stock list first, then adjust quantities here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <SellerCatalogToolbar
            query={query}
            onQueryChange={setQuery}
            category="all"
            onCategoryChange={() => {}}
            categories={["all"]}
            hideCategory
            placeholder="Filter by product name…"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="input h-10 w-full min-w-[160px] lg:w-auto"
        >
          <option value="all">All stock levels</option>
          <option value="low">Low stock only</option>
          <option value="out">Out of stock only</option>
        </select>
      </div>

      <div className="rounded-xl border border-neutral-200/80 bg-white shadow-sm">
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>On hand</Th>
              <Th>Hub availability</Th>
              <Th>Status</Th>
              {canManage ? <Th>Actions</Th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {filtered.map((product) => {
              const qty = Number(product.stock_quantity);
              const level = getStockLevel(qty);
              const hubs = parseLocationInventory(product.metadata, qty);
              return (
                <tr key={product.id} className={level !== "healthy" ? "bg-amber-50/30" : undefined}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Thumb imageUrl={product.image_url} name={product.name} />
                      <div>
                        <p className="font-medium text-neutral-950">{product.name}</p>
                        <p className="text-xs text-neutral-400">{product.slug}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className={level === "out" ? "font-bold text-red-700" : level === "low" ? "font-bold text-amber-700" : "font-semibold"}>
                    {qty.toLocaleString()}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(hubs).filter(([, value]) => value > 0).map(([hub, value]) => (
                        <span key={hub} className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold uppercase text-emerald-800">
                          {hub} {value}
                        </span>
                      ))}
                    </div>
                  </Td>
                  <Td><SellerStockBadge quantity={qty} /></Td>
                  {canManage ? (
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setAdjusting(product)} className="text-xs font-semibold text-brand">Manage hubs</button>
                      </div>
                    </Td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </Table>
        {!filtered.length ? (
          <p className="px-6 py-8 text-center text-sm text-neutral-500">No products match this filter.</p>
        ) : null}
      </div>

      {adjusting ? (
        <StockAdjustModal
          product={adjusting}
          saving={saving}
          onClose={() => setAdjusting(null)}
          onSave={(locations) => void patchStock(adjusting.id, locations)}
        />
      ) : null}
    </div>
  );
}

function Thumb({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill className="object-cover" sizes="40px" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-neutral-400">SKU</div>
      )}
    </div>
  );
}

function StockAdjustModal({
  product,
  saving,
  onClose,
  onSave,
}: {
  product: SellerCatalogProduct;
  saving: boolean;
  onClose: () => void;
  onSave: (locations: ProductLocationInventory) => void;
}) {
  const [locations, setLocations] = useState<ProductLocationInventory>(() =>
    parseLocationInventory(product.metadata, Number(product.stock_quantity)),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-xl border border-neutral-200 bg-white p-5 shadow-xl">
        <h3 className="text-sm font-semibold text-neutral-950">Manage stock locations</h3>
        <p className="mt-1 text-xs text-neutral-500">{product.name}</p>
        <div className="mt-4">
          <ProductLocationInventoryField value={locations} onChange={setLocations} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50">Cancel</button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(locations)}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
