import "server-only";

import { spawn } from "node:child_process";
import path from "node:path";
import { ZAR_PER_USD } from "@/lib/pricing/discovery-pricing";
import { productMatchesModelIntent } from "@/lib/catalog/product-model-match";
import { isRelevantProductHit } from "@/lib/sourcing/query-relevance";
import type { SupplierRegion, SupplierTier, WholesaleSearchHit } from "@/types/supplier-sourcing";

const DEFAULT_TIMEOUT_MS = 120_000;

type EngineHitPayload = {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  region: string;
  tier: string;
  estimatedPriceZar?: number | null;
  estimatedPriceUsd?: number | null;
  supplierMoq?: number | null;
  priceVatStatus?: string;
  listingDescription?: string | null;
  listingSummary?: string | null;
  listingHighlights?: string[] | null;
  score?: number;
};

type EngineResponse = {
  ok: boolean;
  hits?: EngineHitPayload[];
  error?: string;
  count?: number;
};

export function isSupplierEngineEnabled(): boolean {
  const flag = process.env.SUPPLIER_ENGINE_ENABLED?.trim().toLowerCase();
  if (flag === "false" || flag === "0" || flag === "off") return false;
  return true;
}

function mapTier(tier: string): SupplierTier {
  if (tier === "manufacturer") return "manufacturer";
  if (tier === "wholesale") return "wholesale";
  if (tier === "distributor") return "distributor";
  if (tier === "retail") return "retail";
  return "trade";
}

function mapRegion(region: string): SupplierRegion {
  if (region === "south_africa") return "south_africa";
  if (region === "international") return "international";
  return "unknown";
}

function mapVatStatus(status?: string): "ex" | "incl" | "unknown" {
  if (status === "ex") return "ex";
  if (status === "incl") return "incl";
  return "unknown";
}

function normalizeHit(raw: EngineHitPayload, query: string): WholesaleSearchHit | null {
  const url = raw.url?.trim();
  if (!url) return null;

  const title = raw.title?.trim() || raw.domain || "Supplier listing";
  const snippet = raw.snippet?.trim() || raw.listingSummary?.trim() || "";
  const domain = raw.domain?.trim() || (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  const estimatedPriceZar =
    raw.estimatedPriceZar && raw.estimatedPriceZar > 0 ? raw.estimatedPriceZar : undefined;
  const estimatedPriceUsd =
    raw.estimatedPriceUsd && raw.estimatedPriceUsd > 0
      ? raw.estimatedPriceUsd
      : estimatedPriceZar
        ? Math.round((estimatedPriceZar / ZAR_PER_USD) * 100) / 100
        : undefined;

  const hit: WholesaleSearchHit = {
    title,
    url,
    snippet,
    domain,
    region: mapRegion(raw.region),
    tier: mapTier(raw.tier),
    estimatedPriceZar,
    estimatedPriceUsd,
    supplierMoq: raw.supplierMoq && raw.supplierMoq > 0 ? raw.supplierMoq : undefined,
    priceVatStatus: mapVatStatus(raw.priceVatStatus),
    listingDescription: raw.listingDescription ?? undefined,
    listingSummary: raw.listingSummary ?? undefined,
    listingHighlights: raw.listingHighlights ?? undefined,
    score: raw.score ?? 60,
  };

  if (!productMatchesModelIntent(query, title, snippet, hit.listingDescription)) return null;
  if (!isRelevantProductHit(query, title, snippet, url, 25)) return null;

  return hit;
}

function runPythonSupplierEngine(
  query: string,
  options: { maxResults: number; category?: string; overseas: string },
): Promise<EngineResponse> {
  const pythonBin = process.env.PYTHON_BIN?.trim() || "python3";
  const scriptPath = path.join(process.cwd(), "python", "run_supplier_engine.py");
  const timeoutMs = Number(process.env.SUPPLIER_ENGINE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  return new Promise((resolve) => {
    const args = [
      scriptPath,
      query,
      "--max",
      String(options.maxResults),
      "--overseas",
      options.overseas,
    ];
    if (options.category) {
      args.push("--category", options.category);
    }

    const child = spawn(pythonBin, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({ ok: false, error: `Supplier engine timed out after ${timeoutMs}ms`, hits: [] });
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ ok: false, error: err.message, hits: [] });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (!stdout.trim()) {
        resolve({
          ok: false,
          error: stderr.trim() || `Supplier engine exited with code ${code ?? "unknown"}`,
          hits: [],
        });
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as EngineResponse;
        resolve(parsed);
      } catch {
        resolve({
          ok: false,
          error: stderr.trim() || "Invalid JSON from supplier engine",
          hits: [],
        });
      }
    });
  });
}

/**
 * Advanced supplier discovery via the Python supplier engine
 * (SA directories, CIPC verification, overseas fallback, page extraction).
 */
export async function searchSupplierEngine(
  query: string,
  options?: { maxResults?: number; category?: string; overseas?: "auto" | "yes" | "no" | "only" },
): Promise<WholesaleSearchHit[]> {
  if (!isSupplierEngineEnabled()) return [];

  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const maxResults = options?.maxResults ?? 12;
  const overseas = options?.overseas ?? "auto";

  const response = await runPythonSupplierEngine(trimmed, {
    maxResults,
    category: options?.category,
    overseas,
  });

  if (!response.ok || !response.hits?.length) {
    if (response.error && process.env.NODE_ENV === "development") {
      console.warn("[supplier-engine]", trimmed, response.error);
    }
    return [];
  }

  const hits: WholesaleSearchHit[] = [];
  for (const raw of response.hits) {
    const hit = normalizeHit(raw, trimmed);
    if (hit) hits.push(hit);
  }

  return hits.sort((a, b) => b.score - a.score);
}

export async function probeSupplierEngine(query: string): Promise<{
  enabled: boolean;
  ok: boolean;
  hitCount: number;
  error?: string;
  sample?: Array<{ title: string; domain: string; score: number }>;
}> {
  if (!isSupplierEngineEnabled()) {
    return { enabled: false, ok: false, hitCount: 0, error: "SUPPLIER_ENGINE_ENABLED is off" };
  }

  const response = await runPythonSupplierEngine(query.trim(), {
    maxResults: 6,
    overseas: "auto",
  });

  return {
    enabled: true,
    ok: Boolean(response.ok),
    hitCount: response.hits?.length ?? 0,
    error: response.error,
    sample: (response.hits ?? []).slice(0, 4).map((h) => ({
      title: h.title,
      domain: h.domain,
      score: h.score ?? 0,
    })),
  };
}
