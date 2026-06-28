import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductCardData } from "@/types";
import { formatCurrency } from "@/lib/utils/cn";

interface JustSourcedCardProps {
  product: ProductCardData;
}

export function JustSourcedCard({ product }: JustSourcedCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-[28px] bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        {/* Badge + arrow */}
        <div className="mb-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
            Popular
          </span>
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-100 transition-all group-hover:border-neutral-300 group-hover:bg-neutral-50">
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-500 transition-transform group-hover:-rotate-3" />
          </div>
        </div>

        {/* Product image */}
        {product.imageUrl ? (
          <div className="relative h-28 overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex h-28 items-center justify-center rounded-xl bg-neutral-100 text-3xl">📦</div>
        )}

        {/* Name + price */}
        <div className="mt-3">
          <p className="line-clamp-1 text-sm font-bold text-white">{product.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-white">
              {formatCurrency(product.price, product.currency)}
            </span>
            {product.rating && (
              <div className="flex items-center gap-0.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-amber-400">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="text-[10px] text-neutral-500">{product.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
