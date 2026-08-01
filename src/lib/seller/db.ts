import { createServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/admin";

export { isSupabaseServiceConfigured as isSellerDbConfigured } from "@/lib/supabase/admin";

export function sellerDb() {
  return createServiceClient();
}

/** Service client when configured; otherwise null for demo/build fallbacks. */
export function trySellerDb() {
  if (!isSupabaseServiceConfigured()) return null;
  return createServiceClient();
}
