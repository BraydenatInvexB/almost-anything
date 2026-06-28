"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatRating } from "@/lib/utils/cn";
import type { ProductCardData } from "@/types";
import { useState } from "react";

interface NewDealsCardProps {
  product: ProductCardData;
  products?: ProductCardData[];
}

export function NewDealsCard({ product, products = [] }: NewDealsCardProps) {
  const allProducts = products.length > 0 ? products : [product];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = allProducts[activeIndex] ?? product;

  const goPrev = () =>
    setActiveIndex((i) => (i === 0 ? allProducts.length - 1 : i - 1));
  const goNext = () =>
    setActiveIndex((i) => (i === allProducts.length - 1 ? 0 : i + 1));

  return (
    <Card padding="none" className="relative flex min-h-[520px] flex-col bg-neutral-200 lg:min-h-[640px]">
      <div className="absolute inset-0">
        <Image
          src={active.imageUrl}
          alt={active.name}
          fill
          className="object-cover transition-opacity duration-500"
          sizes="(max-width: 768px) 100vw, 33vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-6">
        <h2 className="text-2xl font-semibold text-white drop-shadow-sm">
          New Deals
        </h2>

        <div className="mt-auto">
          <Card
            variant="glass"
            padding="md"
            className="mx-auto max-w-[280px] border border-white/20"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(active.price, active.currency)}
                </p>
                <p className="mt-0.5 text-sm text-neutral-500">{active.name}</p>
              </div>
              <Badge variant="rating" className="gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {formatRating(active.rating)}
              </Badge>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button variant="secondary" size="icon" className="h-9 w-9 rounded-full">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="icon" className="h-9 w-9 rounded-full">
                <ShoppingBag className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-white/90">Slide left and right</p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/90"
                onClick={goPrev}
                aria-label="Previous deal"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-full bg-white/90"
                onClick={goNext}
                aria-label="Next deal"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
