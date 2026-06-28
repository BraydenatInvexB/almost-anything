"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils/cn";
import { useCart } from "@/context/CartProvider";
import type { ProductCardData } from "@/types";

export function BoldProducts({ products }: { products: ProductCardData[] }) {
  const { addItem } = useCart();

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product, i) => (
        <div
          key={product.id}
          className="group flex flex-col overflow-hidden rounded-2xl border-[3px] border-black bg-white shadow-[4px_4px_0_0_#000] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#000]"
        >
          <Link href={`/products/${product.slug}`} className="relative block">
            <div className="relative aspect-square overflow-hidden border-b-[3px] border-black bg-neutral-100">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">📦</div>
              )}
              {product.dealLabel ? (
                <span className="absolute left-2 top-2 -rotate-3 rounded-full border-2 border-black bg-[#FF6B57] px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-[2px_2px_0_0_#000]">
                  {product.dealLabel}
                </span>
              ) : product.isExclusive ? (
                <span className="absolute left-2 top-2 -rotate-3 rounded-full border-2 border-black bg-[#C7A8FF] px-2.5 py-0.5 text-[10px] font-extrabold uppercase shadow-[2px_2px_0_0_#000]">
                  Exclusive
                </span>
              ) : null}
            </div>
          </Link>

          <div className="flex flex-1 flex-col p-3">
            <Link href={`/products/${product.slug}`}>
              <h3 className="line-clamp-1 text-sm font-bold text-black">{product.name}</h3>
            </Link>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span
                className={`inline-block ${i % 2 === 0 ? "-rotate-1" : "rotate-1"} rounded-md border-2 border-black bg-[#CDFF00] px-2 py-0.5 text-sm font-black`}
              >
                {formatCurrency(product.price, product.currency)}
              </span>
              <button
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
                aria-label={`Add ${product.name} to cart`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-black text-white transition-colors hover:bg-[#CDFF00] hover:text-black active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
