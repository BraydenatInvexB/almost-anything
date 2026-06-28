"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, CreditCard } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartProvider";
import { useAuth } from "@/context/AuthProvider";
import { formatCurrency } from "@/lib/utils/cn";
import type { ShippingAddress } from "@/types/cart";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shipping = subtotal > 1000 ? 0 : 99;
  const tax = Math.round(subtotal * 0.15 * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: user?.user_metadata?.full_name ?? "",
    email: user?.email ?? "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          shippingAddress: address,
          paymentMethod: "demo",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }

      clearCart();
      router.push(
        `/checkout/success?orderNumber=${encodeURIComponent(data.orderNumber)}`,
      );
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-full flex-col bg-[#F4EEE1]">
        <SiteHeader />
        <main className="mx-auto max-w-lg flex-1 px-4 py-20 text-center">
          <p className="text-neutral-500">Your cart is empty.</p>
          <Link href="/products" className="mt-4 inline-block">
            <Button>Browse Products</Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F4EEE1]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/cart"
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>

        <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>

        <form
          onSubmit={handleCheckout}
          className="mt-8 grid gap-8 lg:grid-cols-3"
        >
          <div className="space-y-6 lg:col-span-2">
            <Card variant="elevated" className="bg-white p-6">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Full name"
                    value={address.fullName}
                    onChange={(e) =>
                      setAddress({ ...address, fullName: e.target.value })
                    }
                    required
                    className="rounded-2xl"
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={address.email}
                  onChange={(e) =>
                    setAddress({ ...address, email: e.target.value })
                  }
                  required
                  className="rounded-2xl"
                />
                <Input
                  placeholder="Phone"
                  value={address.phone}
                  onChange={(e) =>
                    setAddress({ ...address, phone: e.target.value })
                  }
                  required
                  className="rounded-2xl"
                />
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Address line 1"
                    value={address.addressLine1}
                    onChange={(e) =>
                      setAddress({ ...address, addressLine1: e.target.value })
                    }
                    required
                    className="rounded-2xl"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Address line 2 (optional)"
                    value={address.addressLine2}
                    onChange={(e) =>
                      setAddress({ ...address, addressLine2: e.target.value })
                    }
                    className="rounded-2xl"
                  />
                </div>
                <Input
                  placeholder="City"
                  value={address.city}
                  onChange={(e) =>
                    setAddress({ ...address, city: e.target.value })
                  }
                  required
                  className="rounded-2xl"
                />
                <Input
                  placeholder="State"
                  value={address.state}
                  onChange={(e) =>
                    setAddress({ ...address, state: e.target.value })
                  }
                  required
                  className="rounded-2xl"
                />
                <Input
                  placeholder="Postal code"
                  value={address.postalCode}
                  onChange={(e) =>
                    setAddress({ ...address, postalCode: e.target.value })
                  }
                  required
                  className="rounded-2xl"
                />
                <Input
                  placeholder="Country"
                  value={address.country}
                  onChange={(e) =>
                    setAddress({ ...address, country: e.target.value })
                  }
                  required
                  className="rounded-2xl"
                />
              </div>
            </Card>

            <Card variant="elevated" className="bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="h-5 w-5" />
                Payment
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Demo checkout is enabled. Your order will be placed and our
                sourcing team will begin fulfillment immediately.
              </p>
              <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                <Lock className="mb-2 h-4 w-4" />
                Add Stripe keys to <code className="text-xs">.env.local</code>{" "}
                for live card payments.
              </div>
            </Card>
          </div>

          <Card variant="elevated" className="h-fit bg-white p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <ul className="mt-4 space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between text-sm text-neutral-600"
                >
                  <span className="truncate pr-2">
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">VAT (15%)</dt>
                <dd>{formatCurrency(tax)}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(total)}</dd>
              </div>
            </dl>

            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

            <Button
              type="submit"
              className="mt-6 w-full rounded-full"
              isLoading={loading}
            >
              Place Order · {formatCurrency(total)}
            </Button>
          </Card>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
