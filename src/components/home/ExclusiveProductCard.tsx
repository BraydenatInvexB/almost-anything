import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { ProductCardData } from "@/types";

interface ExclusiveProductCardProps {
  product: ProductCardData;
}

export function ExclusiveProductCard({ product }: ExclusiveProductCardProps) {
  return (
    <Card
      padding="none"
      className="flex min-h-[240px] overflow-hidden bg-neutral-100 lg:min-h-[280px]"
    >
      <div className="flex flex-1 flex-col justify-center p-6 lg:p-8">
        <Badge variant="exclusive" className="mb-4 w-fit">
          Exclusive
        </Badge>
        <h2 className="text-xl font-semibold text-neutral-900">{product.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">
          Sleek, minimalist design meets exceptional comfort. A premium pick from
          our curated collection, delivered fast.
        </p>
        <Link href={`/products/${product.slug}`} className="mt-4">
          <Button variant="primary" size="sm" className="gap-2">
            Open
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="relative w-[45%] min-w-[140px] bg-neutral-200">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="200px"
        />
      </div>
    </Card>
  );
}
