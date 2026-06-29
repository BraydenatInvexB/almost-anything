/**
 * Trigger background workers without blocking customer-facing routes.
 */

export function triggerInternalSourcingProcess(): void {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const key = process.env.INTERNAL_API_KEY;
  if (!key) return;

  void fetch(`${base}/api/internal/sourcing/process`, {
    method: "POST",
    headers: { "x-api-key": key },
  }).catch(() => {
    /* background */
  });
}

export function triggerInternalDiscovery(query: string): void {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const key = process.env.INTERNAL_API_KEY;
  if (!key || !query.trim()) return;

  void fetch(`${base}/api/internal/sourcing/discover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
    },
    body: JSON.stringify({ query: query.trim() }),
  }).catch(() => {
    /* background */
  });
}
