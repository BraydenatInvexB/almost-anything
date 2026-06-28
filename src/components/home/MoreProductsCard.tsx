import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { ProductCardData } from "@/types";

interface MoreProductsCardProps {
  products: ProductCardData[];
  totalCount?: number;
}

export function MoreProductsCard({ products, totalCount = 460 }: MoreProductsCardProps) {
  const previews = products.slice(0, 3);

  return (
    <div className="flex flex-col justify-between rounded-[28px] bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[15px] font-bold text-neutral-900">More Products</p>
          <p className="text-xs text-neutral-500">{totalCount}+ products in stock.</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        </div>
      </div>

      {/* Product thumbnails */}
      <div className="flex items-end gap-2">
        {previews.map((p, i) => (
          <Link
            key={p.id ?? i}
            href={`/products/${p.slug}`}
            className="group relative overflow-hidden rounded-xl bg-neutral-100 transition-all hover:scale-105"
            style={{ width: `${88 - i * 8}px`, height: `${88 - i * 8}px` }}
          >
            {p.imageUrl ? (
              <Image
                src={p.imageUrl}
                alt={p.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl">📦</div>
            )}
          </Link>
        ))}
      </div>

      {/* Browse link */}
      <Link
        href="/products"
        className="mt-4 block text-center text-xs font-semibold text-neutral-400 underline-offset-2 hover:text-neutral-700 hover:underline"
      >
        Browse all →
      </Link>
    </div>
  );
}
