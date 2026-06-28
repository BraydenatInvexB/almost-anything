"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowUpRight,
  Clock,
  DollarSign,
  Sparkles,
  Star,
  Trophy,
  Check,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/cn";
import { QUOTE_TIER_DESCRIPTIONS } from "@/config/site";
import { useCart } from "@/context/CartProvider";
import type { QuoteResponse, QuoteOptionResponse } from "@/types";

const TIER_ICONS = {
  cheapest: DollarSign,
  fastest: Clock,
  best_quality: Trophy,
};

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4EEE1]" />}>
      <QuotePageContent />
    </Suspense>
  );
}

function QuotePageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setQuery(q);
  }, [searchParams]);

  async function handleGenerateQuote(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQuote(null);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          budget: budget ? Number(budget) : undefined,
          urgency: "standard",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to generate quote");
        return;
      }

      setQuote(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F4EEE1]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="exclusive" className="mb-4 bg-neutral-900 text-white">
            Quote Generator
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Tell us what you need. Get your price.
          </h1>
          <p className="mt-3 text-neutral-500">
            Describe what you&apos;re after and we&apos;ll show you a few ready
            options, cheapest, fastest, or best quality, at one simple price.
          </p>
        </div>

        <Card variant="elevated" className="mx-auto mt-10 max-w-2xl bg-white p-8">
          <form onSubmit={handleGenerateQuote} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                What are you looking for?
              </label>
              <Input
                placeholder="e.g. minimalist curved sofa under R12,000, fast delivery"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                required
                className="rounded-2xl"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Budget (optional)
              </label>
              <Input
                type="number"
                placeholder="500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="rounded-2xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-full"
              isLoading={loading}
            >
              <Sparkles className="h-4 w-4" />
              Generate Quote Options
            </Button>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
          </form>
        </Card>

        {quote ? (
          <div className="mt-12">
            <div className="mb-6 text-center">
              <p className="text-sm text-neutral-500">
                We understood:{" "}
                <span className="font-medium text-neutral-900">
                  {quote.parsedIntent.productType}
                </span>
                {quote.parsedIntent.attributes.length > 0
                  ? ` · ${quote.parsedIntent.attributes.join(", ")}`
                  : null}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {quote.options.map((option) => (
                <QuoteOptionCard
                  key={option.id}
                  option={option}
                  requestId={quote.requestId}
                />
              ))}
            </div>
          </div>
        ) : null}

        <Card variant="default" id="how-it-works" className="mx-auto mt-16 max-w-3xl p-8">
          <CardTitle>How it works</CardTitle>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Tell us what you want",
              "Pick from a few ready options",
              "See one clear price per option",
              "Choose cheapest, fastest, or best",
              "Check out securely",
              "We deliver it to your door, fully tracked",
            ].map((step, i) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-600">{step}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <SiteFooter />
    </div>
  );
}

function QuoteOptionCard({
  option,
  requestId,
}: {
  option: QuoteOptionResponse;
  requestId: string;
}) {
  const Icon = TIER_ICONS[option.tier];
  const router = useRouter();
  const { addItem } = useCart();
  const [selected, setSelected] = useState(false);

  function handleSelect() {
    addItem({
      type: "quote",
      name: option.productName,
      price: option.retailPrice,
      currency: "ZAR",
      imageUrl: option.imageUrl ?? undefined,
      quoteOptionId: option.id,
      quoteRequestId: requestId,
      tier: option.tier,
      supplierName: option.supplierName,
    });
    setSelected(true);
    setTimeout(() => router.push("/cart"), 800);
  }

  return (
    <Card variant="elevated" className="flex flex-col bg-white p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
          <Icon className="h-5 w-5 text-neutral-900" />
        </div>
        <div>
          <CardTitle className="text-base">{option.tierLabel}</CardTitle>
          <CardDescription className="text-xs">
            {QUOTE_TIER_DESCRIPTIONS[option.tier]}
          </CardDescription>
        </div>
      </div>

      {option.imageUrl ? (
        <div className="relative mt-4 aspect-4/3 overflow-hidden rounded-2xl bg-neutral-100">
          <Image
            src={option.imageUrl}
            alt={option.productName}
            fill
            className="object-cover"
            sizes="300px"
          />
        </div>
      ) : null}

      <div className="mt-4 flex-1">
        <h3 className="font-semibold text-neutral-900">{option.productName}</h3>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">
              {formatCurrency(option.retailPrice)}
            </p>
            <p className="text-xs text-neutral-400">Delivered to your door</p>
          </div>
          {option.rating ? (
            <span className="flex items-center gap-1 text-sm text-neutral-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {option.rating}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex gap-3 text-xs text-neutral-500">
          <span>{option.deliveryDays} day delivery</span>
          <span>Quality: {option.qualityScore}/100</span>
        </div>
      </div>

      <Button className="mt-6 w-full rounded-full" onClick={handleSelect}>
        {selected ? (
          <>
            <Check className="h-4 w-4" />
            Added to Cart
          </>
        ) : (
          <>
            Select Option
            <ArrowUpRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </Card>
  );
}
