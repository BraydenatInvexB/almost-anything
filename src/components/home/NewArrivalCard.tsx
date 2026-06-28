import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductCardData } from "@/types";
import { formatCurrency } from "@/lib/utils/cn";

interface NewArrivalCardProps {
  product: ProductCardData;
}

export function NewArrivalCard({ product }: NewArrivalCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-[28px] bg-neutral-100 p-5 shadow-sm transition-shadow hover:shadow-md">
        {/* Top row */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500">New Arrival</p>
            <p className="mt-0.5 text-[15px] font-bold leading-tight text-white">
              {product.name.split(" ").slice(0, 3).join(" ")}
            </p>
          </div>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:-rotate-3">
            <ArrowUpRight className="h-3.5 w-3.5 text-neutral-700" />
          </div>
        </div>

        {/* Product image */}
        {product.imageUrl ? (
          <div className="flex h-24 items-center justify-center">
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={120}
              height={96}
              className="max-h-24 w-auto object-contain drop-shadow-md"
            />
          </div>
        ) : (
          <div className="flex h-24 items-center justify-center text-3xl">📦</div>
        )}

        {/* Price */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm font-bold text-white">
            {formatCurrency(product.price, product.currency)}
          </span>
          {product.dealDiscountPercent && product.dealDiscountPercent > 0 && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
              {product.dealDiscountPercent}% off
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
