"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { CUSTOMER_WAREHOUSE_FINDING_MESSAGES } from "@/config/warehouse-copy";
import { postDiscoverOnce } from "@/lib/search/discover-client";
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

const POLL_MS = 4000;
const MAX_WAIT_MS = 120_000;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(id);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

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
      setMessageIndex((i) => (i + 1) % CUSTOMER_WAREHOUSE_FINDING_MESSAGES.length);
    }, 3200);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (!query.trim() || initialCount > 0) return;

    const pollAbort = new AbortController();
    let pollInFlight = false;

    async function fetchByQuery(): Promise<PaginatedResponse<ProductCardData> | null> {
      const res = await fetch(
        `/api/products?q=${encodeURIComponent(query)}&pageSize=16`,
        { cache: "no-store", signal: pollAbort.signal },
      );
      if (!res.ok) return null;
      return res.json() as Promise<PaginatedResponse<ProductCardData>>;
    }

    async function fetchBySlugs(slugs: string[]): Promise<PaginatedResponse<ProductCardData> | null> {
      if (!slugs.length) return null;
      const res = await fetch(
        `/api/products?slugs=${encodeURIComponent(slugs.join(","))}&pageSize=16`,
        { cache: "no-store", signal: pollAbort.signal },
      );
      if (!res.ok) return null;
      return res.json() as Promise<PaginatedResponse<ProductCardData>>;
    }

    function finish(searching: boolean, next: "idle" | "error") {
      onSearchingChange?.(searching);
      setStatus(next);
    }

    async function publishIfReady(result: PaginatedResponse<ProductCardData> | null): Promise<boolean> {
      if (pollAbort.signal.aborted || !result?.data.length) return false;
      onProductsLoadedRef.current?.(result);
      finish(false, "idle");

      if (result.data.some((p) => !p.imageUrl?.trim())) {
        void pollForProductImages(result.data.map((p) => p.slug));
      }
      return true;
    }

    async function pollForProductImages(slugs: string[]): Promise<void> {
      for (let attempt = 0; attempt < 12 && !pollAbort.signal.aborted; attempt += 1) {
        await sleep(3000, pollAbort.signal).catch(() => undefined);
        const result = await fetchByQuery();
        if (!result?.data.length) continue;
        const hasNewImage = result.data.some(
          (p) => p.imageUrl?.trim() && slugs.includes(p.slug),
        );
        if (hasNewImage) {
          onProductsLoadedRef.current?.(result);
        }
        if (result.data.every((p) => p.imageUrl?.trim())) return;
      }
    }

    async function loadDiscovered(slugs: string[]): Promise<boolean> {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        if (pollAbort.signal.aborted) return false;
        if (await publishIfReady(await fetchByQuery())) return true;
        if (await publishIfReady(await fetchBySlugs(slugs))) return true;
        if (attempt < 5) {
          await sleep(600 + attempt * 400, pollAbort.signal).catch(() => undefined);
        }
      }
      return false;
    }

    async function run() {
      setStatus("finding");
      onSearchingChange?.(true);

      const deadline = Date.now() + MAX_WAIT_MS;
      const discoverPromise = postDiscoverOnce(query);
      let discoverHandled = false;

      try {
        while (Date.now() < deadline && !pollAbort.signal.aborted) {
          const raced = await Promise.race([
            discoverPromise.then((res) => ({ kind: "discover" as const, res })),
            sleep(POLL_MS, pollAbort.signal).then(() => ({ kind: "poll" as const })),
          ]);

          if (raced.kind === "poll") {
            if (!pollInFlight) {
              pollInFlight = true;
              try {
                if (await publishIfReady(await fetchByQuery())) return;
              } finally {
                pollInFlight = false;
              }
            }
            continue;
          }

          const res = raced.res;
          if (!res.ok) {
            if (!discoverHandled) finish(false, "error");
            return;
          }

          discoverHandled = true;
          const data = (await res.json()) as DiscoveryResponse;
          const slugs = data.slugs ?? [];

          if (await loadDiscovered(slugs)) return;

          if ((data.discovered ?? 0) > 0) {
            if (await loadDiscovered(slugs)) return;
          }

          // Discover finished with no rows — keep polling until the overall deadline.
          continue;
        }

        if (!pollAbort.signal.aborted) {
          if (await loadDiscovered([])) return;
          finish(false, "error");
        }
      } catch (err) {
        if (pollAbort.signal.aborted) return;
        finish(false, "error");
      }
    }

    void run();
    return () => {
      pollAbort.abort();
      onSearchingChange?.(false);
    };
  }, [query, initialCount, onSearchingChange]);

  if (status === "idle") return null;

  const findingMessage = CUSTOMER_WAREHOUSE_FINDING_MESSAGES[messageIndex];

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
