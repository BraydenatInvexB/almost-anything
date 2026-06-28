"use client";

import Link from "next/link";
import Image from "next/image";
import { useStorefrontSettings } from "@/hooks/useStorefrontSettings";
import { computeStorefrontTotals } from "@/lib/pricing/storefront-totals";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartProvider";
import { formatCurrency } from "@/lib/utils/cn";

export default function CartPage() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } =
    useCart();
  const { settings } = useStorefrontSettings();

  const pricing = settings
    ? computeStorefrontTotals(subtotal, settings)
    : { shipping: 0, tax: 0, total: subtotal, shippingCalc: { displayFree: true, customerCharge: 0, internalCost: 0 } };
  const { shipping, tax, total, shippingCalc } = pricing;
  const currency = settings?.currency ?? "ZAR";

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          Shopping Cart
          {itemCount > 0 ? (
            <span className="ml-2 text-lg font-normal text-neutral-500">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          ) : null}
        </h1>

        {items.length === 0 ? (
          <Card variant="elevated" className="mt-8 bg-white py-20 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 text-lg font-medium text-neutral-900">
              Your cart is empty
            </p>
            <p className="mt-2 text-neutral-500">
              Browse our catalog or tell us what you need.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/products">
                <Button>Browse Products</Button>
              </Link>
              <Link href="/request">
                <Button variant="secondary">Request a Product</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {items.map((item) => (
                <Card
                  key={item.id}
                  variant="elevated"
                  className="flex gap-4 bg-white p-4 sm:p-6"
                >
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-neutral-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {item.name}
                        </h3>
                        {item.slug ? (
                          <Link
                            href={`/products/${item.slug}`}
                            className="mt-0.5 text-xs text-neutral-500 hover:text-neutral-900"
                          >
                            View product
                            {item.variantLabel ? ` · ${item.variantLabel}` : ""}
                          </Link>
                        ) : item.variantLabel ? (
                          <p className="mt-0.5 text-xs text-neutral-500">{item.variantLabel}</p>
                        ) : null}
                      </div>
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear cart
              </Button>
            </div>

            <Card variant="elevated" className="h-fit bg-white p-6">
              <h2 className="text-lg font-semibold">Order Summary</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Subtotal</dt>
                  <dd>{formatCurrency(subtotal, currency)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Shipping</dt>
                  <dd>
                    {shippingCalc.displayFree || shipping === 0
                      ? "Included"
                      : formatCurrency(shipping, currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">VAT ({Math.round((settings?.taxRate ?? 0.15) * 100)}%)</dt>
                  <dd>{formatCurrency(tax, currency)}</dd>
                </div>
                <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-semibold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(total, currency)}</dd>
                </div>
              </dl>
              {settings && !settings.embedShippingInPrice && subtotal > 0 && subtotal < settings.freeShippingThreshold ? (
                <p className="mt-3 text-xs text-neutral-400">
                  Free shipping on orders over {formatCurrency(settings.freeShippingThreshold, currency)}
                </p>
              ) : settings?.embedShippingInPrice ? (
                <p className="mt-3 text-xs text-neutral-400">Delivery is included in product prices.</p>
              ) : null}
              <Link href="/checkout" className="mt-6 block">
                <Button className="w-full rounded-full">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
