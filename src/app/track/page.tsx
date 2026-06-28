"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, CalendarClock, Truck, PackageSearch } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TrackTimeline } from "@/components/orders/TrackTimeline";
import { findDemoOrder, type TrackedOrder } from "@/lib/orders/demo-track";
import { formatCurrency } from "@/lib/utils/cn";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function TrackInner() {
  const params = useSearchParams();
  const [input, setInput] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [notFound, setNotFound] = useState(false);

  function lookup(value: string) {
    const found = findDemoOrder(value);
    setOrder(found ?? null);
    setNotFound(!found && value.trim().length > 0);
  }

  useEffect(() => {
    const q = params.get("order");
    if (q) {
      setInput(q);
      lookup(q);
    }
  }, [params]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-600">
          <Truck className="h-3.5 w-3.5 text-[#FF6B57]" />
          Order tracking
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900">
          Track your package
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Enter your order number to see exactly where it is.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(input);
        }}
        className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-full border border-neutral-200 bg-white p-1.5 pl-5 shadow-sm focus-within:border-neutral-300"
      >
        <Search className="h-5 w-5 shrink-0 text-neutral-400" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. AA-2026-4821"
          aria-label="Order number"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          Track
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-neutral-400">
        Try a sample: AA-2026-4821, AA-2026-4790, or AA-2026-4715
      </p>

      {notFound && (
        <Card variant="elevated" className="mt-8 bg-white py-12 text-center">
          <PackageSearch className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 font-medium text-neutral-900">No order found</p>
          <p className="mt-1 text-sm text-neutral-500">
            Double-check your order number, it&apos;s in your confirmation email.
          </p>
        </Card>
      )}

      {order && (
        <div className="mt-8 space-y-4">
          <Card variant="elevated" className="bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm font-semibold text-neutral-900">
                  {order.orderNumber}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Placed {formatDate(order.placedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-neutral-50 px-3.5 py-2 text-xs">
                <CalendarClock className="h-4 w-4 text-[#FF6B57]" />
                <span className="text-neutral-500">Arriving by</span>
                <span className="font-semibold text-neutral-900">
                  {formatDate(order.estimatedDelivery)}
                </span>
              </div>
            </div>

            <div className="mt-7">
              <TrackTimeline status={order.status} />
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 border-t border-neutral-100 pt-5 sm:grid-cols-2">
              <div className="flex items-start gap-2.5 text-sm">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Carrier</p>
                  <p className="font-medium text-neutral-900">{order.carrier}</p>
                  <p className="font-mono text-xs text-neutral-500">{order.trackingNumber}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-400">Delivering to</p>
                  <p className="font-medium text-neutral-900">{order.recipient}</p>
                  <p className="text-xs text-neutral-500">{order.city}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="bg-white p-6">
            <h2 className="text-sm font-semibold text-neutral-900">In this order</h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((item) => (
                <li key={item.name} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(item.price)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-neutral-100 pt-4 text-sm font-bold text-neutral-900">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </Card>

          <div className="text-center">
            <Link
              href="/help"
              className="text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
            >
              Need help with this order?
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TrackPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#F4EEE1]">
      <SiteHeader />
      <Suspense fallback={<div className="flex-1" />}>
        <TrackInner />
      </Suspense>
      <SiteFooter />
    </div>
  );
}
