import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      anonKey &&
      !url.includes("your-project") &&
      !anonKey.includes("your-anon-key"),
  );
}

/** True when server-side service-role access is available (not just public anon keys). */
export function isSupabaseServiceConfigured(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(
    isSupabaseConfigured() &&
      serviceKey &&
      !serviceKey.includes("your-service"),
  );
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey || !isSupabaseServiceConfigured()) {
    throw new Error(
      "Missing Supabase service role configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
