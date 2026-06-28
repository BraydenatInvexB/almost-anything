"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, CreditCard, Truck } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartProvider";
import { useAuth } from "@/context/AuthProvider";
import { formatCurrency } from "@/lib/utils/cn";
import type { ShippingAddress } from "@/types/cart";
import { COURIERS, calculateCustomerShipping } from "@/config/couriers";

interface StoreSettings {
  freeShippingThreshold: number;
  flatShippingFee: number;
  taxRate: number;
  embedShippingInPrice: boolean;
  defaultCourierId: string;
  couriers: { id: string; name: string; etaLabel: string }[];
  config?: import("@/lib/admin/operations-types").ExtendedPlatformConfig;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [courierId, setCourierId] = useState("aramex");
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: user?.user_metadata?.full_name ?? "",
    email: user?.email ?? "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "ZA",
  });

  useEffect(() => {
    fetch("/api/storefront/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setCourierId(data.defaultCourierId ?? "aramex");
      })
      .catch(() => {
        setSettings({
          freeShippingThreshold: 1000,
          flatShippingFee: 99,
          taxRate: 0.15,
          embedShippingInPrice: true,
          defaultCourierId: "aramex",
          couriers: COURIERS.map((c) => ({ id: c.id, name: c.name, etaLabel: c.etaLabel })),
        });
      });
  }, []);

  const shippingCalc = settings
    ? calculateCustomerShipping(subtotal, courierId, {
        freeShippingThreshold: settings.freeShippingThreshold,
        flatShippingFee: settings.flatShippingFee,
        embedShippingInPrice: settings.embedShippingInPrice,
        config: settings.config,
      })
    : { customerCharge: 0, internalCost: 0, displayFree: true };

  const shipping = shippingCalc.customerCharge;
  const tax = Math.round(subtotal * (settings?.taxRate ?? 0.15) * 100) / 100;
  const total = Math.round((subtotal + shipping + tax) * 100) / 100;
  const selectedCourier = COURIERS.find((c) => c.id === courierId);

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
          paymentMethod,
          courierId,
          courierName: selectedCourier?.name,
          shippingInternalCost: shippingCalc.internalCost,
          customerShippingCharge: shipping,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }

      clearCart();
      router.push(`/checkout/success?orderNumber=${encodeURIComponent(data.orderNumber)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-full flex-col bg-white">
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
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6">
        <Link href="/cart" className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" />
          Back to cart
        </Link>

        <h1 className="text-2xl font-bold text-neutral-900">Checkout</h1>

        <form onSubmit={handleCheckout} className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card variant="elevated" className="bg-white p-6">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Input placeholder="Full name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} required className="rounded-2xl" />
                </div>
                <Input type="email" placeholder="Email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} required className="rounded-2xl" />
                <Input placeholder="Phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} required className="rounded-2xl" />
                <div className="sm:col-span-2">
                  <Input placeholder="Address line 1" value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} required className="rounded-2xl" />
                </div>
                <Input placeholder="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required className="rounded-2xl" />
                <Input placeholder="Province" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} required className="rounded-2xl" />
                <Input placeholder="Postal code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} required className="rounded-2xl" />
                <Input placeholder="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} required className="rounded-2xl" />
              </div>
            </Card>

            <Card variant="elevated" className="bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Truck className="h-5 w-5" />
                Courier
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                {settings?.embedShippingInPrice
                  ? "Delivery is included in your item prices. Select your preferred courier below."
                  : "Choose your delivery partner."}
              </p>
              <div className="mt-4 space-y-2">
                {(settings?.couriers ?? COURIERS).map((c) => (
                  <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${courierId === c.id ? "border-brand bg-brand/5" : "border-neutral-200"}`}>
                    <input type="radio" name="courier" value={c.id} checked={courierId === c.id} onChange={() => setCourierId(c.id)} />
                    <div>
                      <p className="font-semibold text-neutral-900">{c.name}</p>
                      <p className="text-xs text-neutral-500">{c.etaLabel}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            <Card variant="elevated" className="bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="h-5 w-5" />
                Payment method
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  { id: "card", label: "Credit / debit card" },
                  { id: "eft", label: "Instant EFT" },
                  { id: "demo", label: "Demo checkout" },
                ].map((m) => (
                  <label key={m.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium ${paymentMethod === m.id ? "border-brand bg-brand/5" : "border-neutral-200"}`}>
                    <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} />
                    {m.label}
                  </label>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                <Lock className="mb-2 h-4 w-4" />
                Secure checkout. Payment method is recorded on your order for support and finance.
              </div>
            </Card>
          </div>

          <Card variant="elevated" className="h-fit bg-white p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <ul className="mt-4 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm text-neutral-600">
                  <span className="truncate pr-2">{item.name} × {item.quantity}</span>
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
                <dt className="text-neutral-500">Delivery {selectedCourier ? `(${selectedCourier.name})` : ""}</dt>
                <dd className={shippingCalc.displayFree ? "font-semibold text-emerald-600" : ""}>
                  {shipping === 0 ? "Free" : formatCurrency(shipping)}
                </dd>
              </div>
              {settings?.embedShippingInPrice && (
                <p className="text-xs text-neutral-400">Delivery cost is included in product prices.</p>
              )}
              <div className="flex justify-between">
                <dt className="text-neutral-500">VAT</dt>
                <dd>{formatCurrency(tax)}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(total)}</dd>
              </div>
            </dl>

            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

            <Button type="submit" className="mt-6 w-full rounded-full" isLoading={loading}>
              Place Order · {formatCurrency(total)}
            </Button>
          </Card>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
