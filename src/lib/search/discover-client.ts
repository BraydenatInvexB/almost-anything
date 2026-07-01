/** Client-side dedupe so remounts / strict mode do not spam discover + poll. */
const discoverInFlight = new Map<string, Promise<Response>>();
const discoverCompleted = new Map<string, { at: number; slugs: string[] }>();
const COMPLETED_TTL_MS = 5 * 60_000;

export function postDiscoverOnce(query: string): Promise<Response> {
  const key = query.trim().toLowerCase();
  const cached = discoverCompleted.get(key);
  if (cached && Date.now() - cached.at < COMPLETED_TTL_MS) {
    return Promise.resolve(
      new Response(
        JSON.stringify({
          query: key,
          discovered: cached.slugs.length,
          slugs: cached.slugs,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
  }

  const existing = discoverInFlight.get(key);
  if (existing) return existing;

  const job = fetch("/api/sourcing/discover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
    .then(async (res) => {
      if (res.ok) {
        try {
          const data = (await res.clone().json()) as { slugs?: string[] };
          discoverCompleted.set(key, { at: Date.now(), slugs: data.slugs ?? [] });
        } catch {
          /* ignore */
        }
      }
      return res;
    })
    .finally(() => {
      discoverInFlight.delete(key);
    });

  discoverInFlight.set(key, job);
  return job;
}
