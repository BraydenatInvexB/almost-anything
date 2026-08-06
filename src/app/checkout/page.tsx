"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, CreditCard, Truck } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartProvider";
import { usePromo } from "@/context/PromoProvider";
import { useAuth } from "@/context/AuthProvider";
import { formatCurrency } from "@/lib/utils/cn";
import type { ShippingAddress } from "@/types/cart";
import { useStorefrontSettings } from "@/hooks/useStorefrontSettings";
import { computeStorefrontTotals } from "@/lib/pricing/storefront-totals";
import { PromoCodeInput } from "@/components/checkout/PromoCodeInput";
import { ShippingAddressSection } from "@/components/checkout/ShippingAddressSection";
import type { OrderDeliverySizeSummary } from "@/lib/delivery/size";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { applied, discountAmount } = usePromo();
  const { user, isConfigured } = useAuth();
  const { settings } = useStorefrontSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const courierId = "almost_anything";
  const [deliverySize, setDeliverySize] = useState<OrderDeliverySizeSummary | null>(null);
  const paymentOptions = [
    { id: "card" as const, label: "Pay securely online" },
    ...(process.env.NODE_ENV === "development"
      ? [{ id: "demo" as const, label: "Demo checkout (development only)" }]
      : []),
  ];
  const [paymentMethod, setPaymentMethod] = useState(
    () => "card" as "card" | "demo",
  );
  const [saveAddress, setSaveAddress] = useState(true);

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "ZA",
  });

  useEffect(() => {
    if (!user) return;
    // Populate the checkout form when the asynchronous auth session arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAddress((prev) => ({
      ...prev,
      fullName: prev.fullName || (user.user_metadata?.full_name as string) || "",
      email: prev.email || user.email || "",
      phone: prev.phone || (user.user_metadata?.phone as string) || "",
    }));
  }, [user]);

  const productIds = useMemo(
    () => items.map((i) => i.productId).filter((id): id is string => Boolean(id)),
    [items],
  );

  useEffect(() => {
    if (productIds.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDeliverySize(null);
      return;
    }
    let cancelled = false;
    fetch("/api/checkout/fulfillment-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds }),
    })
      .then((r) => r.json())
      .then(
        (data: {
          deliverySize?: OrderDeliverySizeSummary;
        }) => {
          if (cancelled) return;
          setDeliverySize(data.deliverySize ?? null);
        },
      )
      .catch(() => {
        if (cancelled) return;
        setDeliverySize(null);
      });
    return () => {
      cancelled = true;
    };
  }, [productIds]);

  const currency = settings?.currency ?? "ZAR";
  const pricing = settings
    ? computeStorefrontTotals(subtotal, settings, courierId, discountAmount, deliverySize?.size)
    : {
        shipping: 0,
        tax: 0,
        total: subtotal,
        promoDiscount: discountAmount,
        discountedSubtotal: Math.max(0, subtotal - discountAmount),
        shippingCalc: { displayFree: true, customerCharge: 0, internalCost: 0 },
        deliveryFeeZar: 0,
      };
  const { shipping, tax, total, shippingCalc, promoDiscount, discountedSubtotal } = pricing;
  const deliveryProvider = "Almost Anything";

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
          courierName: "Almost Anything Delivery",
          shippingInternalCost: shippingCalc.internalCost,
          customerShippingCharge: shipping,
          promoCode: applied?.code,
          saveAddress: Boolean(user && isConfigured && saveAddress),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }

      if (data.mode === "hosted_payment" && data.redirectUrl) {
        const url = new URL(data.redirectUrl, window.location.origin);
        url.searchParams.set("method", paymentMethod);
        router.push(`${url.pathname}${url.search}`);
        return;
      }

      clearCart();
      router.push(data.redirectUrl ?? `/checkout/success?orderNumber=${encodeURIComponent(data.orderNumber)}`);
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
            <ShippingAddressSection
              isLoggedIn={Boolean(user && isConfigured)}
              userEmail={user?.email}
              address={address}
              onAddressChange={setAddress}
              saveForLater={saveAddress}
              onSaveForLaterChange={setSaveAddress}
            />

            <Card variant="elevated" className="bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Truck className="h-5 w-5" />
                Delivery
              </h2>
              <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                  Delivery handled by
                </p>
                <p className="mt-1 font-semibold text-neutral-900">{deliveryProvider}</p>
                <p className="mt-1 text-neutral-500">
                  We coordinate collection, driver allocation, tracking, and delivery. The R100 standard or R200 large-item delivery fee is shown in your order summary.
                </p>
              </div>
              {deliverySize?.showCustomerNote && deliverySize.customerNote ? (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  {deliverySize.customerNote}
                </p>
              ) : null}
            </Card>

            <Card variant="elevated" className="bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CreditCard className="h-5 w-5" />
                Payment method
              </h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {paymentOptions.map((m) => (
                  <label key={m.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 p-3 text-sm font-medium ${paymentMethod === m.id ? "border-brand bg-brand/5" : "border-neutral-200"}`}>
                    <input type="radio" name="payment" value={m.id} checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} />
                    {m.label}
                  </label>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                <Lock className="mb-2 h-4 w-4" />
                Payment is completed securely through PayFast or Ozow. Your full card and banking details are never stored by Almost Anything.
              </div>
            </Card>
          </div>

          <Card variant="elevated" className="h-fit bg-white p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>
            <div className="mt-4">
              <PromoCodeInput currency={currency} />
            </div>
            <ul className="mt-4 space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm text-neutral-600">
                  <span className="truncate pr-2">{item.name} × {item.quantity}</span>
                  <span>{formatCurrency(item.price * item.quantity, currency)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd>{formatCurrency(subtotal, currency)}</dd>
              </div>
              {promoDiscount > 0 ? (
                <div className="flex justify-between text-emerald-600">
                  <dt>Promo discount</dt>
                  <dd>-{formatCurrency(promoDiscount, currency)}</dd>
                </div>
              ) : null}
              {promoDiscount > 0 ? (
                <div className="flex justify-between font-medium">
                  <dt>After discount</dt>
                  <dd>{formatCurrency(discountedSubtotal, currency)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-neutral-500">
                  Delivery
                  {deliverySize &&
                  (deliverySize.size === "large" || deliverySize.size === "bulky")
                    ? " (large item)"
                    : ""}
                </dt>
                <dd className={shippingCalc.displayFree ? "font-semibold text-emerald-600" : ""}>
                  {shipping === 0 ? "Free" : formatCurrency(shipping, currency)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-500">VAT included (15%)</dt>
                <dd>{formatCurrency(tax, currency)}</dd>
              </div>
              <div className="flex justify-between pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(total, currency)}</dd>
              </div>
            </dl>

            {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}

            <Button type="submit" className="mt-6 w-full rounded-full" isLoading={loading}>
              Continue to payment · {formatCurrency(total, currency)}
            </Button>
          </Card>
        </form>
      </main>

      <SiteFooter />
    </div>
  );
}
