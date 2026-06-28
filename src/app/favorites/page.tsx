"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useFavorites } from "@/context/FavoritesProvider";
import { useCart } from "@/context/CartProvider";
import { formatCurrency, formatRating } from "@/lib/utils/cn";

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const { addItem } = useCart();

  return (
    <div className="flex min-h-full flex-col bg-[#F4EEE1]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-neutral-900">Favorites</h1>
        <p className="mt-1 text-neutral-500">
          {favorites.length} saved {favorites.length === 1 ? "item" : "items"}
        </p>

        {favorites.length === 0 ? (
          <Card variant="elevated" className="mt-8 bg-white py-16 text-center">
            <Heart className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 font-medium">No favorites yet</p>
            <p className="mt-2 text-sm text-neutral-500">
              Tap the heart icon on any product to save it here.
            </p>
            <Link href="/products" className="mt-6 inline-block">
              <Button>Browse Products</Button>
            </Link>
          </Card>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((item) => (
              <Card
                key={item.slug}
                variant="elevated"
                padding="none"
                className="overflow-hidden bg-white"
              >
                <Link href={`/products/${item.slug}`}>
                  <div className="relative aspect-[4/3] bg-neutral-100">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="300px"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(item.price, item.currency)}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-neutral-500">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {formatRating(item.rating)}
                    </span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 rounded-full"
                      onClick={() =>
                        addItem({
                          type: "product",
                          slug: item.slug,
                          name: item.name,
                          price: item.price,
                          currency: item.currency,
                          imageUrl: item.imageUrl,
                        })
                      }
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-red-500"
                      onClick={() => removeFavorite(item.slug)}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
