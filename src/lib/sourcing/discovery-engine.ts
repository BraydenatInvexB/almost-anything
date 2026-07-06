import "server-only";

/** Auto-discovery is disabled — storefront search uses the listed catalog only. */

export type DiscoveryResult = {
  query: string;
  discovered: number;
  slugs: string[];
  products: { slug: string; name: string; retailPrice: number }[];
  durationMs: number;
  cached?: boolean;
  disabled?: boolean;
};

export async function discoverAndIngestProducts(query: string): Promise<DiscoveryResult> {
  const trimmed = query.trim();
  return {
    query: trimmed,
    discovered: 0,
    slugs: [],
    products: [],
    durationMs: 0,
    disabled: true,
  };
}

export function triggerBackgroundDiscovery(_query: string, _resultCount: number): void {
  /* catalog-only search */
}
