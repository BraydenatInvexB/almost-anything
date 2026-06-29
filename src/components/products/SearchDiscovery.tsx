"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { PaginatedResponse, ProductCardData } from "@/types";

type Props = {
  query: string;
  initialCount: number;
  onSearchingChange?: (searching: boolean) => void;
  onProductsLoaded?: (result: PaginatedResponse<ProductCardData>) => void;
};

type DiscoveryResponse = {
  discovered?: number;
  slugs?: string[];
};

const POLL_MS = 2500;

const FINDING_MESSAGES = [
  "Searching South African suppliers…",
  "Scanning trade & wholesale catalogues…",
  "Checking international wholesalers…",
];

export function SearchDiscovery({
  query,
  initialCount,
  onSearchingChange,
  onProductsLoaded,
}: Props) {
  const [status, setStatus] = useState<"idle" | "finding" | "error">(
    initialCount === 0 ? "finding" : "idle",
  );
  const [messageIndex, setMessageIndex] = useState(0);
  const onProductsLoadedRef = useRef(onProductsLoaded);
  onProductsLoadedRef.current = onProductsLoaded;

  useEffect(() => {
    if (status !== "finding") return;
    const id = setInterval(() => {
      setMessageIndex((i) => (i + 1) % FINDING_MESSAGES.length);
    }, 3200);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (!query.trim() || initialCount > 0) return;

    let cancelled = false;

    async function fetchByQuery(): Promise<PaginatedResponse<ProductCardData> | null> {
      const res = await fetch(
        `/api/products?q=${encodeURIComponent(query)}&pageSize=16`,
        { cache: "no-store" },
      );
      if (!res.ok) return null;
      return res.json() as Promise<PaginatedResponse<ProductCardData>>;
    }

    async function fetchBySlugs(slugs: string[]): Promise<PaginatedResponse<ProductCardData> | null> {
      if (!slugs.length) return null;
      const res = await fetch(
        `/api/products?slugs=${encodeURIComponent(slugs.join(","))}&pageSize=16`,
        { cache: "no-store" },
      );
      if (!res.ok) return null;
      return res.json() as Promise<PaginatedResponse<ProductCardData>>;
    }

    async function publishIfReady(result: PaginatedResponse<ProductCardData> | null) {
      if (cancelled || !result?.data.length) return false;
      onProductsLoadedRef.current?.(result);
      onSearchingChange?.(false);
      setStatus("idle");
      return true;
    }

    async function loadDiscovered(slugs: string[]) {
      const byQuery = await fetchByQuery();
      if (await publishIfReady(byQuery)) return true;

      const bySlugs = await fetchBySlugs(slugs);
      if (await publishIfReady(bySlugs)) return true;

      return false;
    }

    async function run() {
      setStatus("finding");
      onSearchingChange?.(true);

      const discoverPromise = fetch("/api/sourcing/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const pollId = setInterval(async () => {
        if (cancelled) return;
        const result = await fetchByQuery();
        if (await publishIfReady(result)) {
          clearInterval(pollId);
        }
      }, POLL_MS);

      try {
        const res = await discoverPromise;
        clearInterval(pollId);
        if (cancelled) return;

        if (!res.ok) {
          onSearchingChange?.(false);
          setStatus("error");
          return;
        }

        const data = (await res.json()) as DiscoveryResponse;
        const slugs = data.slugs ?? [];

        if (await loadDiscovered(slugs)) return;

        if ((data.discovered ?? 0) > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, 600));
          if (await loadDiscovered(slugs)) return;
        }

        setStatus("error");
        onSearchingChange?.(false);
      } catch {
        clearInterval(pollId);
        if (!cancelled) {
          setStatus("error");
          onSearchingChange?.(false);
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [query, initialCount]);

  if (status === "idle") return null;

  const findingMessage = FINDING_MESSAGES[messageIndex];

  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
      {status === "finding" ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" />
          <p className="text-neutral-700 transition-opacity duration-300">{findingMessage}</p>
        </>
      ) : (
        <p className="text-neutral-500">
          We could not find this right now. Try a shorter or different search term.
        </p>
      )}
    </div>
  );
}
