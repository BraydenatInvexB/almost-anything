import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";

/** Full seed catalog size — used only to decide when to stop showing seed fallbacks on browse pages. */
export const MIN_LIVE_CATALOG_SIZE = SEED_PRODUCTS.length;

let cachedReady: boolean | null = null;
let cachedHasAny: boolean | null = null;
let cachedAt = 0;
const CACHE_MS = 30_000;

export function invalidateCatalogCache(): void {
  cachedReady = null;
  cachedHasAny = null;
  cachedAt = 0;
}

async function refreshCatalogCache(): Promise<void> {
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    cachedReady = false;
    cachedHasAny = false;
    cachedAt = Date.now();
    return;
  }

  try {
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    const total = error ? 0 : (count ?? 0);
    cachedHasAny = total > 0;
    cachedReady = total >= MIN_LIVE_CATALOG_SIZE;
  } catch {
    cachedReady = false;
    cachedHasAny = false;
  }

  cachedAt = Date.now();
}

async function ensureCache(): Promise<void> {
  if (cachedReady === null || cachedHasAny === null || Date.now() - cachedAt >= CACHE_MS) {
    await refreshCatalogCache();
  }
}

/** True when Supabase has the full ingested catalog (browse pages can skip seed fallback). */
export async function isLiveCatalogReady(): Promise<boolean> {
  await ensureCache();
  return cachedReady === true;
}

/** True when at least one product exists in Supabase (discovered or ingested). */
export async function hasSupabaseProducts(): Promise<boolean> {
  await ensureCache();
  return cachedHasAny === true;
}

/** Search and slug lookups always use Supabase when configured. */
export function shouldQuerySupabase(): boolean {
  return isSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
