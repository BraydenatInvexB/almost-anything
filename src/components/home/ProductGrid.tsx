"use client";

import Link from "next/link";
import Image from "next/image";
import { formatCurrency, formatRating } from "@/lib/utils/cn";
import { FavoriteButton } from "@/components/products/FavoriteButton";
import { AddToCartButton } from "@/components/products/AddToCartButton";
import type { ProductCardData } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ProductGridProps {
  products: ProductCardData[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="col-span-full flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-[24px] border-[3px] border-black bg-white py-16 text-center shadow-[5px_5px_0_0_#000]">
        <span className="text-3xl">🔍</span>
        <p className="text-sm font-semibold text-black">No products found. Try a different search.</p>
        <Link href="/products" className="mt-2 text-xs font-extrabold uppercase text-black underline underline-offset-2">
          Browse all products →
        </Link>
      </div>
    );
  }

  return (
    <>
      {products.map((product, i) => (
        <div
          key={product.id}
          className="group relative flex flex-col overflow-hidden rounded-[20px] border-[3px] border-black bg-white shadow-[4px_4px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000]"
        >
          {/* Image */}
          <div className="relative">
            <Link href={`/products/${product.slug}`}>
              <div className="relative aspect-square overflow-hidden border-b-[3px] border-black bg-neutral-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
              )}

              {/* Badges */}
              {product.isExclusive && (
                <span className="absolute left-2 top-2 -rotate-3 rounded-full border-2 border-black bg-[#C7A8FF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-black shadow-[2px_2px_0_0_#000]">
                  Exclusive
                </span>
              )}
              {product.dealLabel && !product.isExclusive && (
                <span className="absolute left-2 top-2 -rotate-3 rounded-full border-2 border-black bg-brand px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-[2px_2px_0_0_#000]">
                  {product.dealLabel}
                </span>
              )}

              {/* Wishlist */}
            </div>
            </Link>
            <FavoriteButton product={product} className="absolute right-2 top-2 z-10" />
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col p-3">
            <Link href={`/products/${product.slug}`} className="block">
              <h3 className="line-clamp-1 text-sm font-bold text-black">
                {product.name}
              </h3>
            </Link>

            {product.rating && (
              <div className="mt-1 flex items-center gap-0.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-amber-400">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-[11px] font-semibold text-neutral-500">{formatRating(product.rating)}</span>
              </div>
            )}

            <div className="mt-auto flex items-center justify-between gap-2 pt-3">
              <span
                className={cn(
                  "inline-block rounded-md border-2 border-black bg-brand px-2 py-0.5 text-sm font-black text-white",
                  i % 2 === 0 ? "-rotate-1" : "rotate-1",
                )}
              >
                {formatCurrency(product.price, product.currency)}
              </span>
              <AddToCartButton
                icon="bag"
                item={{
                  type: "product",
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  currency: product.currency,
                  imageUrl: product.imageUrl,
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
