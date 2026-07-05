import { createClient } from "@/lib/supabase/server";
import { DEMO_SETTINGS } from "@/lib/admin/demo-data";
import { getExtendedConfig } from "@/lib/admin/operations-store";
import { getAllCouriers } from "@/config/couriers";
import { mergeExtendedConfig } from "@/lib/admin/extended-config-defaults";
import type { ExtendedPlatformConfig } from "@/lib/admin/operations-types";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { PlatformSettings } from "@/types/database";

export async function getSettings(): Promise<PlatformSettings> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("platform_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (data) return data as PlatformSettings;
    } catch {
      /* fall through */
    }
  }
  return DEMO_SETTINGS;
}

export async function getPlatformExtendedConfig(): Promise<ExtendedPlatformConfig> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("platform_settings")
        .select("extended_config")
        .eq("id", 1)
        .maybeSingle();
      if (data?.extended_config) {
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

export async function listAdminCouriers(): Promise<{ id: string; name: string }[]> {
  const config = await getPlatformExtendedConfig();
  return getAllCouriers(config).map((c) => ({ id: c.id, name: c.name }));
}
