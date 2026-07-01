import "server-only";

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

export function isGoogleSearchConfigured(): boolean {
  return Boolean(process.env.GOOGLE_API_KEY?.trim() && process.env.GOOGLE_CSE_ID?.trim());
}

async function rawGoogleSearch(
  query: string,
  opts: { num?: number } = {},
): Promise<WebSearchResult[]> {
  const key = process.env.GOOGLE_API_KEY?.trim();
  const cx = process.env.GOOGLE_CSE_ID?.trim();
  if (!key || !cx) return [];

  const params = new URLSearchParams({
    key,
    cx,
    q: query,
    num: String(opts.num ?? 10),
  });

  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: Array<{ title: string; link: string; snippet?: string; displayLink?: string }>;
  };

  return (data.items ?? []).map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet ?? "",
    displayLink: item.displayLink ?? new URL(item.link).hostname,
  }));
}

export async function searchProductZA(query: string): Promise<WebSearchResult[]> {
  return rawGoogleSearch(`${query} price South Africa buy wholesale`, { num: 10 });
}

export async function searchProductIntl(query: string): Promise<WebSearchResult[]> {
  return rawGoogleSearch(`${query} buy price wholesale`, { num: 10 });
}

export async function searchNewOldStock(
  query: string,
  region: "ZA" | "INTL",
): Promise<WebSearchResult[]> {
  const suffix =
    region === "ZA"
      ? 'South Africa "new old stock" OR clearance OR liquidation OR "authorized dealer" -used -refurbished -secondhand'
      : '"new old stock" OR clearance OR liquidation OR "authorized dealer" -used -refurbished -secondhand';
  return rawGoogleSearch(`${query} ${suffix}`, { num: 10 });
}
