import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { normalizeSearchQuery } from "@/lib/search/normalize";

function searchTbl() {
  // Tables added in migration 012 — not yet in generated Database types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServiceClient().from("search_events" as any);
}

function sourcingRunsTbl() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServiceClient().from("sourcing_runs" as any);
}

export type SearchInputMethod = "text" | "voice" | "image" | "request" | "admin";

export type SearchEventInput = {
  query: string;
  inputMethod?: SearchInputMethod;
  source?: string;
  sessionId?: string;
  userId?: string;
  resultCount?: number;
  metadata?: Record<string, unknown>;
};

export type SearchTermSummary = {
  normalizedQuery: string;
  sampleQuery: string;
  count: number;
  lastSearchedAt: string;
  avgResultCount: number | null;
  zeroResultCount: number;
};

export type SearchAnalyticsSummary = {
  totalSearches: number;
  uniqueQueries: number;
  zeroResultSearches: number;
  topTerms: SearchTermSummary[];
  recentEvents: {
    id: string;
    query: string;
    source: string;
    inputMethod: string;
    resultCount: number | null;
    createdAt: string;
  }[];
  dailyVolume: { date: string; searches: number }[];
};

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

/** Fire-and-forget safe: never throws to callers. */
export async function logSearchEvent(input: SearchEventInput): Promise<void> {
  const query = input.query.trim();
  if (!query || query.length < 2) return;
  if (!isSupabaseConfigured()) return;

  try {
    await searchTbl().insert({
      query: query.slice(0, 500),
      normalized_query: normalizeSearchQuery(query),
      input_method: input.inputMethod ?? "text",
      source: input.source ?? "storefront",
      session_id: input.sessionId ?? null,
      user_id: input.userId ?? null,
      result_count: input.resultCount ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Analytics must not break storefront flows.
  }
}

export async function getSearchAnalyticsSummary(
  days: number = 30,
): Promise<SearchAnalyticsSummary> {
  const empty: SearchAnalyticsSummary = {
    totalSearches: 0,
    uniqueQueries: 0,
    zeroResultSearches: 0,
    topTerms: [],
    recentEvents: [],
    dailyVolume: [],
  };

  if (!isSupabaseConfigured()) return empty;

  const since = daysAgoIso(days);

  const { data: events, error } = await searchTbl()
    .select("id, query, normalized_query, source, input_method, result_count, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error || !events?.length) return empty;

  const rows = events as unknown as Record<string, unknown>[];

  const termMap = new Map<string, SearchTermSummary>();
  const dailyMap = new Map<string, number>();
  let zeroResultSearches = 0;

  for (const row of rows) {
    const key = row.normalized_query as string;
    const existing = termMap.get(key);
    const resultCount = row.result_count as number | null;
    if (resultCount === 0) zeroResultSearches += 1;

    if (existing) {
      existing.count += 1;
      if (new Date(row.created_at as string) > new Date(existing.lastSearchedAt)) {
        existing.lastSearchedAt = row.created_at as string;
        existing.sampleQuery = row.query as string;
      }
      if (resultCount !== null) {
        const prev = existing.avgResultCount ?? 0;
        existing.avgResultCount = Math.round(
          (prev * (existing.count - 1) + resultCount) / existing.count,
        );
      }
      if (resultCount === 0) existing.zeroResultCount += 1;
    } else {
      termMap.set(key, {
        normalizedQuery: key,
        sampleQuery: row.query as string,
        count: 1,
        lastSearchedAt: row.created_at as string,
        avgResultCount: resultCount,
        zeroResultCount: resultCount === 0 ? 1 : 0,
      });
    }

    const day = (row.created_at as string).slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }

  const topTerms = [...termMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  const dailyVolume = [...dailyMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, searches]) => ({ date, searches }));

  return {
    totalSearches: rows.length,
    uniqueQueries: termMap.size,
    zeroResultSearches,
    topTerms,
    recentEvents: rows.slice(0, 25).map((row) => ({
      id: row.id as string,
      query: row.query as string,
      source: row.source as string,
      inputMethod: row.input_method as string,
      resultCount: row.result_count as number | null,
      createdAt: row.created_at as string,
    })),
    dailyVolume,
  };
}

export async function enqueueSourcingRun(input: {
  requestId: string;
  query: string;
  inputMethod?: SearchInputMethod;
}): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await sourcingRunsTbl()
      .insert({
        request_id: input.requestId,
        query: input.query,
        status: "pending",
        input_method: input.inputMethod ?? "request",
      })
      .select("id")
      .single();

    if (error || !data) return null;
    return (data as unknown as { id: string }).id;
  } catch {
    return null;
  }
}
