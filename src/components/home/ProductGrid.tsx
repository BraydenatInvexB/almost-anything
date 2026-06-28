"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart } from "lucide-react";
import { formatCurrency, formatRating } from "@/lib/utils/cn";
import { useCart } from "@/context/CartProvider";
import { useFavorites } from "@/context/FavoritesProvider";
import type { ProductCardData } from "@/types";
import { cn } from "@/lib/utils/cn";

interface ProductGridProps {
  products: ProductCardData[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  if (products.length === 0) {
    return (
      <div className="col-span-full flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-[24px] border-[3px] border-black bg-white py-16 text-center shadow-[5px_5px_0_0_#000]">
        <span className="text-3xl">🔍</span>
        <p className="text-sm font-semibold text-black">No products found. Try a different search.</p>
        <a href="/products" className="mt-2 text-xs font-extrabold uppercase text-black underline underline-offset-2">
          Browse all products →
        </a>
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
                <span className="absolute left-2 top-2 -rotate-3 rounded-full border-2 border-black bg-[#FF6B57] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-[2px_2px_0_0_#000]">
                  {product.dealLabel}
                </span>
              )}

              {/* Favorite button overlay */}
              <button
                className={cn(
                  "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-black bg-white shadow-[2px_2px_0_0_#000] transition-all",
                  isFavorite(product.slug) ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                )}
                onClick={(e) => {
                  e.preventDefault();
                  toggleFavorite({
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    currency: product.currency,
                    imageUrl: product.imageUrl,
                    rating: product.rating,
                  });
                }}
                aria-label={isFavorite(product.slug) ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isFavorite(product.slug) ? "fill-[#FF6B57] text-[#FF6B57]" : "text-black",
                  )}
                />
              </button>
            </div>
          </Link>

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
                  "inline-block rounded-md border-2 border-black bg-[#CDFF00] px-2 py-0.5 text-sm font-black",
                  i % 2 === 0 ? "-rotate-1" : "rotate-1",
                )}
              >
                {formatCurrency(product.price, product.currency)}
              </span>
              <button
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-black text-white transition-colors hover:bg-[#CDFF00] hover:text-black active:scale-95"
                aria-label={`Add ${product.name} to cart`}
                onClick={() =>
                  addItem({
                    type: "product",
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    currency: product.currency,
                    imageUrl: product.imageUrl,
                  })
                }
              >
                <ShoppingBag className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
