"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Check, ImageIcon } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { clearSearchPhoto, readSearchPhoto } from "@/lib/utils/search-photo";

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <RequestPageContent />
    </Suspense>
  );
}

function RequestPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [email, setEmail] = useState("");
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");
  const [photo, setPhoto] = useState<{ dataUrl: string; name: string } | null>(null);

  useEffect(() => {
    if (searchParams.get("from") === "photo") {
      const stored = readSearchPhoto();
      if (stored) {
        setPhoto(stored);
        if (!searchParams.get("q")) {
          setQuery("I'm looking for something like the photo I uploaded.");
        }
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/sourcing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          email: email || undefined,
          budget: budget ? Number(budget) : undefined,
          urgency: "standard",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Request failed");
        return;
      }

      setSubmitted(true);
      setSubmittedRef(data.requestNumber ?? data.requestId ?? "");
      clearSearchPhoto();
      setPhoto(null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <div className="text-center">
          <Badge variant="exclusive" className="mb-4 bg-neutral-900 text-white">
            Request an item
          </Badge>
          <h1 className="text-3xl font-bold text-neutral-900">
            Looking for something specific?
          </h1>
          <p className="mt-3 text-neutral-500">
            Tell us exactly what you want. We&apos;ll confirm your price and have it
            on its way to your door, one simple price, no hassle.
          </p>
        </div>

        {submitted ? (
          <Card variant="elevated" className="mt-10 bg-white p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand">
              <Check className="h-7 w-7 text-neutral-900" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-neutral-900">
              Got it, we&apos;re on it.
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              We&apos;ll confirm availability and your price
              {email ? " and email you shortly" : " shortly"}. Most requests are
              ready the same day.
              {submittedRef ? (
                <>
                  {" "}
                  Your reference is <strong className="font-mono">{submittedRef}</strong>.
                </>
              ) : null}
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <Link href="/products">
                <Button className="rounded-full">Keep shopping</Button>
              </Link>
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => {
                  setSubmitted(false);
                  setSubmittedRef("");
                  setQuery("");
                  setBudget("");
                }}
              >
                Request another
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card variant="elevated" className="mt-10 bg-white p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                {photo ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex items-start gap-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.dataUrl} alt="Your reference photo" className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                          <ImageIcon className="h-4 w-4" />
                          Reference photo attached
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {photo.name} — tell us any extra details below (size, colour, budget, etc.).
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            clearSearchPhoto();
                            setPhoto(null);
                          }}
                          className="mt-2 text-xs font-medium text-neutral-500 underline hover:text-neutral-900"
                        >
                          Remove photo
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Search className="h-4 w-4" />
                    What are you looking for?
                  </label>
                  <Input
                    placeholder="e.g. vintage leather armchair, under R15,000, fast delivery"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    required
                    className="rounded-2xl"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Email (optional)
                    </label>
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-2xl"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Budget (optional)
                    </label>
                    <Input
                      type="number"
                      placeholder="5000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="rounded-2xl"
                    />
                  </div>
                </div>

                {error ? <p className="text-sm text-red-500">{error}</p> : null}

                <Button type="submit" className="w-full rounded-full" isLoading={loading}>
                  Submit request
                </Button>
              </form>
            </Card>

            <Card variant="default" className="mt-8 p-6">
              <CardTitle>What happens next</CardTitle>
              <CardDescription className="mt-4 space-y-2">
                <p>1. Tell us exactly what you want, and your budget if you have one</p>
                <p>2. We confirm it&apos;s available and lock in your price</p>
                <p>3. Check out securely whenever you&apos;re happy</p>
                <p>4. We deliver it straight to your door, fully tracked</p>
              </CardDescription>
            </Card>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
