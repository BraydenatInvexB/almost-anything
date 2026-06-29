import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";

/** Full seed catalog size — live Supabase must match before we switch off seed data. */
export const MIN_LIVE_CATALOG_SIZE = SEED_PRODUCTS.length;

let cachedReady: boolean | null = null;
let cachedAt = 0;
const CACHE_MS = 60_000;

/**
 * True when Supabase has the full ingested catalog. Uses the service role so
 * auth state (signed in vs guest) never changes the answer.
 */
export async function isLiveCatalogReady(): Promise<boolean> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }

  if (cachedReady !== null && Date.now() - cachedAt < CACHE_MS) {
    return cachedReady;
  }

  try {
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    cachedReady = !error && (count ?? 0) >= MIN_LIVE_CATALOG_SIZE;
  } catch {
    cachedReady = false;
  }

  cachedAt = Date.now();
  return cachedReady;
}
