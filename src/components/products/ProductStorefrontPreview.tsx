"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { Eye, ShoppingBag, X } from "lucide-react";
import type { ProductEnrichment } from "@/types/product-enrichment";
import type { ProductVariantsConfig } from "@/types/product-variants";
import { formatCurrency } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  name: string;
  category: string;
  description: string;
  price: number;
  images: string[];
  enrichment: ProductEnrichment;
  variants: ProductVariantsConfig;
  stockLabel?: string;
};

export function ProductStorefrontPreview({ open, onClose, name, category, description, price, images, enrichment, variants, stockLabel = "In stock" }: Props) {
  if (!open || typeof document === "undefined") return null;
  const image = images.find(Boolean);
  const specs = Object.entries(enrichment.specifications).filter(([label]) => label.trim());

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/65 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label="Product storefront preview">
      <div className="flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] bg-[#faf9f7] shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff0f1] text-brand"><Eye className="h-4 w-4" /></span>
            <div>
              <p className="text-sm font-semibold text-neutral-950">Storefront preview</p>
              <p className="text-[11px] text-neutral-500">This is how the product information will appear to shoppers.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50" aria-label="Close preview"><X className="h-4 w-4" /></button>
        </header>

        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="grid items-start gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white">
              {image ? (
                <Image src={image} alt={name || "Product preview"} fill sizes="50vw" className="object-contain p-8" unoptimized={image.startsWith("http") && !image.includes("unsplash")} />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-400">Add a product image to see it here</div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">{category || "Category"}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] text-neutral-950">{name.trim() || "Your product name"}</h2>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-neutral-950">{formatCurrency(Number.isFinite(price) ? price : 0, "ZAR")}</p>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />{stockLabel}</p>

              {variants.options.length ? (
                <div className="mt-6 space-y-4 border-t border-neutral-100 pt-5">
                  {variants.options.map((option) => (
                    <div key={option.name}>
                      <p className="text-sm font-semibold text-neutral-900">{option.name || "Option"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {option.values.length ? option.values.map((item, index) => (
                          <span key={item} className={`rounded-full border px-3 py-1.5 text-xs font-medium ${index === 0 ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 text-neutral-700"}`}>{item}</span>
                        )) : <span className="text-xs text-neutral-400">Add choices to preview this option</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <button type="button" className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white"><ShoppingBag className="h-4 w-4" /> Add to cart</button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 rounded-[1.5rem] border border-neutral-200 bg-white p-5 sm:p-7 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">About this product</p>
              <p className="mt-3 text-sm leading-6 text-neutral-600">{enrichment.summary?.trim() || description.trim() || "Add a description or short summary to preview the product introduction."}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">Key features</p>
              {enrichment.highlights.length ? (
                <ul className="mt-3 space-y-2">
                  {enrichment.highlights.map((feature, index) => <li key={`${index}-${feature}`} className="flex gap-2 text-sm leading-6 text-neutral-700"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{feature}</li>)}
                </ul>
              ) : <p className="mt-3 text-sm text-neutral-400">Add key features to see them here.</p>}
            </div>
            {specs.length ? (
              <div className="lg:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">Specifications</p>
                <dl className="mt-3 grid overflow-hidden rounded-xl border border-neutral-200 sm:grid-cols-2">
                  {specs.map(([label, specValue]) => <div key={label} className="flex justify-between gap-4 border-b border-neutral-100 px-4 py-3 text-sm last:border-b-0 sm:odd:border-r"><dt className="text-neutral-500">{label}</dt><dd className="text-right font-medium text-neutral-900">{specValue || "Not entered"}</dd></div>)}
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
