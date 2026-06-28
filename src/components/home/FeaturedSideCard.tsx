import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductCardData } from "@/types";

interface FeaturedSideCardProps {
  product: ProductCardData;
}

export function FeaturedSideCard({ product }: FeaturedSideCardProps) {
  return (
    <Link href={`/products/${product.slug}`} className="group block flex-1">
      <div className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-neutral-900 shadow-sm transition-all hover:shadow-lg">
        {/* Image */}
        {product.imageUrl ? (
          <div className="relative flex flex-1 min-h-[140px] items-center justify-center overflow-hidden">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/80 via-neutral-900/10 to-transparent" />
          </div>
        ) : (
          <div className="flex flex-1 min-h-[140px] items-center justify-center text-4xl bg-neutral-800">📦</div>
        )}

        {/* Text */}
        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-400">
              {product.isExclusive ? "Exclusive" : "Featured"}
            </p>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 transition-colors group-hover:bg-white/20">
              <ArrowUpRight className="h-3 w-3 text-white" />
            </div>
          </div>
          <p className="text-sm font-semibold leading-tight text-white">{product.name}</p>
          {product.description && (
            <p className="mt-1 line-clamp-1 text-xs text-neutral-500">{product.description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
