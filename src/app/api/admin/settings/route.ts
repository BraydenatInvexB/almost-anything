import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { updateExtendedConfig } from "@/lib/admin/operations-persistence";
import { mergeExtendedConfig } from "@/lib/admin/extended-config-defaults";
import type { Database, Json } from "@/types/database";

type SettingsUpdate = Database["public"]["Tables"]["platform_settings"]["Update"];

const heroShowcaseItemSchema = z.object({
  id: z.string(),
  searchQuery: z.string(),
  name: z.string(),
  price: z.number().min(0),
  currency: z.string(),
  deliveryDays: z.string(),
  imageUrl: z.string(),
  inStock: z.boolean(),
  stockLabel: z.string().optional(),
  productSlug: z.string().optional(),
});

const extendedConfigSchema = z.object({
  embedShippingInPrice: z.boolean(),
  freeShippingEnabled: z.boolean().optional(),
  flatShippingFeeEnabled: z.boolean().optional(),
  defaultCourierId: z.string(),
  enabledCourierIds: z.array(z.string()),
  couriers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        baseCost: z.number(),
        etaLabel: z.string(),
        regions: z.array(z.string()),
      }),
    )
    .optional(),
  heroShowcase: z
    .object({
      panelLabel: z.string(),
      buyButtonLabel: z.string(),
      items: z.array(heroShowcaseItemSchema).min(1),
      stickers: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          color: z.enum(["brand", "blue", "purple", "green"]),
          rotate: z.enum(["left", "right", "none"]),
        }),
      ),
    })
    .optional(),
});

const schema = z.object({
  store_name: z.string().min(1).optional(),
  support_email: z.string().email().optional(),
  currency: z.string().optional(),
  default_markup_percent: z.number().min(0).max(500).optional(),
  min_markup_percent: z.number().min(0).max(500).optional(),
  max_markup_percent: z.number().min(0).max(500).optional(),
  free_shipping_threshold: z.number().min(0).optional(),
  flat_shipping_fee: z.number().min(0).optional(),
  tax_rate: z.number().min(0).max(1).optional(),
  auto_publish_sourced: z.boolean().optional(),
  maintenance_mode: z.boolean().optional(),
  extendedConfig: extendedConfigSchema.optional(),
});

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!staffCan(staff, "settings.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    if (parsed.data.extendedConfig) updateExtendedConfig(parsed.data.extendedConfig);
    const { extendedConfig: _ext, ...platform } = parsed.data;
    return NextResponse.json({ ok: true, demo: true, settings: platform });
  }

  try {
    const supabase = createServiceClient();
    const { extendedConfig, ...platform } = parsed.data;
    const updatePayload: SettingsUpdate = {
      ...platform,
      updated_by: staff.id,
      updated_at: new Date().toISOString(),
    };
    if (extendedConfig) {
      updatePayload.extended_config = mergeExtendedConfig(extendedConfig) as unknown as Json;
      updateExtendedConfig(extendedConfig);
    }
    const { data, error } = await supabase
      .from("platform_settings")
      .update(updatePayload)
      .eq("id", 1)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("staff_activity_log").insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      action: "Updated platform settings",
      entity_type: "settings",
      entity_id: "1",
      details: parsed.data,
    });

    return NextResponse.json({ ok: true, settings: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
