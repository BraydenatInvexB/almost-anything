import "server-only";

import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { DEMO_SETTINGS } from "@/lib/admin/demo-data";
import { mergeExtendedConfig } from "@/lib/admin/extended-config-defaults";
import { getExtendedConfig } from "@/lib/admin/operations-persistence";
import type { PlatformSettings } from "@/types/database";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";

/**
 * Storefront pricing/shipping settings readable by all visitors.
 * Uses the service role so guests and customers see the same values as staff.
 */
export async function getPublicStorefrontSettings(): Promise<PlatformSettings> {
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data) {
        return data as PlatformSettings;
      }
    } catch {
      /* fall through */
    }
  }

  return DEMO_SETTINGS;
}

export async function getPublicStorefrontConfig(): Promise<ExtendedPlatformConfig> {
  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("platform_settings")
        .select("extended_config")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data?.extended_config) {
        return mergeExtendedConfig(
          data.extended_config as Partial<ExtendedPlatformConfig>,
        );
      }
    } catch {
      /* fall through */
    }
  }

  return mergeExtendedConfig(getExtendedConfig());
}
