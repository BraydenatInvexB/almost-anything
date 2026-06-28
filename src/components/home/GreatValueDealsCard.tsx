import Image from "next/image";
import Link from "next/link";
import { Tag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRating } from "@/lib/utils/cn";
import type { ProductCardData } from "@/types";

interface GreatValueDealsCardProps {
  product: ProductCardData;
}

export function GreatValueDealsCard({ product }: GreatValueDealsCardProps) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card
        padding="lg"
        className="group relative flex min-h-[280px] flex-col justify-between bg-neutral-100 transition-shadow hover:shadow-md lg:min-h-[300px]"
      >
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Great Value Deals
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Find Items On Sale With 50 to 75%
          </p>
        </div>

        <div className="relative mt-4 flex flex-1 items-end justify-center">
          <div className="relative h-40 w-full max-w-[220px] transition-transform duration-300 group-hover:scale-105">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain object-bottom"
              sizes="220px"
            />
          </div>
          <Badge
            variant="rating"
            className="absolute bottom-2 left-2 gap-1 shadow-sm"
          >
            <Tag className="h-3 w-3" />
            {formatRating(product.rating)}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
