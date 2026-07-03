import "server-only";

export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

function googleApiKey(): string | undefined {
  return process.env.GOOGLE_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim();
}

export function isGoogleSearchConfigured(): boolean {
  return Boolean(googleApiKey());
}

function displayLinkFromWeb(title: string, uri: string): string {
  const trimmedTitle = title.trim();
  if (trimmedTitle && !trimmedTitle.includes(" ")) return trimmedTitle.replace(/^www\./, "");
  try {
    return new URL(uri).hostname.replace(/^www\./, "");
  } catch {
    return trimmedTitle || uri;
  }
}

type GeminiGroundingChunk = {
  web?: { uri?: string; title?: string };
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: GeminiGroundingChunk[];
    };
  }>;
};

async function geminiGoogleSearch(
  query: string,
  opts: { num?: number } = {},
): Promise<WebSearchResult[]> {
  const key = googleApiKey();
  if (!key) return [];

  const model = process.env.GOOGLE_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const limit = opts.num ?? 10;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Search the web for up to ${limit} real product listing or wholesale supplier pages relevant to: ${query}. Prefer pages with prices and buy/trade options.`,
              },
            ],
          },
        ],
        tools: [{ google_search: {} }],
      }),
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (!res.ok) return [];

  const data = (await res.json()) as GeminiGenerateResponse;
  const chunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

  const seen = new Set<string>();
  const results: WebSearchResult[] = [];

  for (const chunk of chunks) {
    const uri = chunk.web?.uri?.trim();
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);

    const title = chunk.web?.title?.trim() || displayLinkFromWeb("", uri);
    results.push({
      title,
      link: uri,
      snippet: "",
      displayLink: displayLinkFromWeb(title, uri),
    });

    if (results.length >= limit) break;
  }

  return results;
}

export async function searchProductZA(query: string): Promise<WebSearchResult[]> {
  return geminiGoogleSearch(`${query} price South Africa buy wholesale`, { num: 10 });
}

export async function searchProductIntl(query: string): Promise<WebSearchResult[]> {
  return geminiGoogleSearch(`${query} buy price wholesale`, { num: 10 });
}

export async function searchNewOldStock(
  query: string,
  region: "ZA" | "INTL",
): Promise<WebSearchResult[]> {
  const suffix =
    region === "ZA"
      ? 'South Africa "new old stock" OR clearance OR liquidation OR "authorized dealer" -used -refurbished -secondhand'
      : '"new old stock" OR clearance OR liquidation OR "authorized dealer" -used -refurbished -secondhand';
  return geminiGoogleSearch(`${query} ${suffix}`, { num: 10 });
}
