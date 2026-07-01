"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { formatCurrency, formatRating } from "@/lib/utils/cn";
import { FavoriteButton } from "@/components/products/FavoriteButton";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import { ProductCardImage } from "@/components/products/ProductCardImage";
import { getCategory } from "@/config/categories";
import type { ProductCardData } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ProductCardProps {
  product: ProductCardData;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const categoryMeta = getCategory(product.category);
  const isSaWarehouse = product.warehouseLabel?.includes("South Africa");

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-200 hover:border-neutral-900 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]">
      {/* Fixed-ratio media — must not collapse when image uses position:absolute */}
      <div className="relative w-full shrink-0 overflow-hidden bg-neutral-100 [aspect-ratio:1/1]">
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 z-0 block"
          tabIndex={-1}
          aria-hidden
        >
          <ProductCardImage
            src={product.imageUrl}
            alt={product.name}
            category={product.category}
            name={product.name}
            priority={priority}
          />
        </Link>

        {(product.dealLabel || product.isExclusive) && (
          <span
            className={cn(
              "pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
              product.isExclusive
                ? "bg-violet-200 text-violet-950"
                : "bg-brand text-white",
            )}
          >
            {product.isExclusive ? "Exclusive" : product.dealLabel}
          </span>
        )}

        <FavoriteButton
          product={product}
          className="absolute right-2.5 top-2.5 z-20 border-neutral-200 bg-white/95 shadow-sm backdrop-blur-sm hover:bg-white"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        <Link
          href={`/products/${product.slug}`}
          className="min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-brand sm:text-[15px]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
          {product.rating ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {formatRating(product.rating)}
            </span>
          ) : null}

          {product.warehouseLabel ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                isSaWarehouse
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-sky-50 text-sky-800",
              )}
            >
              {isSaWarehouse ? "SA warehouse" : "International"}
            </span>
          ) : product.stockLabel ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              {product.stockLabel}
            </span>
          ) : categoryMeta ? (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
              {categoryMeta.label}
            </span>
          ) : null}
        </div>

        {product.unitPriceLabel ? (
          <p className="mt-1.5 text-[11px] text-neutral-500">{product.unitPriceLabel}</p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-neutral-100 pt-3.5">
          {product.price > 0 ? (
            <p className="text-base font-bold tabular-nums text-neutral-900 sm:text-lg">
              {formatCurrency(product.price, product.currency)}
            </p>
          ) : (
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Price on request
            </p>
          )}

          <AddToCartButton
            item={{
              type: "product",
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              currency: product.currency,
              imageUrl: product.imageUrl,
              minimumOrderQuantity: product.minimumOrderQuantity,
              quantity: product.minimumOrderQuantity ?? 1,
            }}
            disabled={product.price <= 0}
            className="h-9 min-w-[4.5rem] shrink-0 px-3 text-xs"
          />
        </div>
      </div>
    </article>
  );
}
