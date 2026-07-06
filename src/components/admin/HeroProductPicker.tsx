"use client";

import { useEffect, useRef, useState } from "react";
import { Package, Search } from "lucide-react";
import type { HeroImportProduct } from "@/lib/hero/product-to-showcase";

interface HeroProductPickerProps {
  disabled?: boolean;
  onSelect: (product: HeroImportProduct) => void;
}

export function HeroProductPicker({ disabled, onSelect }: HeroProductPickerProps) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<HeroImportProduct[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 1) {
      setProducts([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(q.trim())}&limit=8`,
        );
        const data = await res.json();
        setProducts(data.products ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          disabled={disabled}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => products.length > 0 && setOpen(true)}
          placeholder="Search catalog to import…"
          className="input w-full pl-9 disabled:opacity-60"
        />
      </div>

      {open && (loading || products.length > 0) ? (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-xs text-neutral-500">Searching…</p>
          ) : (
            products.map((product) => (
              <button
                key={product.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onSelect(product);
                  setQ("");
                  setProducts([]);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 border-b border-neutral-100 px-3 py-2 text-left last:border-0 hover:bg-neutral-50 disabled:opacity-50"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                  {product.image_url || product.enhanced_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.enhanced_image_url ?? product.image_url ?? ""}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="m-2 h-6 w-6 text-neutral-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">{product.name}</p>
                  <p className="text-xs text-neutral-500">{product.slug}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-neutral-700">
                  R {Number(product.retail_price).toLocaleString("en-ZA")}
                </p>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
