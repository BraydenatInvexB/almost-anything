import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { createCustomProduct, updateCustomProduct } from "@/lib/admin/operations-persistence";
import { SA_WAREHOUSE_DELIVERY_DAYS } from "@/config/delivery";
import type { Database } from "@/types/database";

type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

const patchSchema = z.object({
  id: z.string().min(1),
  markup_percent: z.number().min(0).max(500).optional(),
  retail_price: z.number().min(0).optional(),
  base_price: z.number().min(0).optional(),
  is_featured: z.boolean().optional(),
  is_deal: z.boolean().optional(),
  show_in_hot: z.boolean().optional(),
  show_in_steals: z.boolean().optional(),
  show_in_fresh_drops: z.boolean().optional(),
  stock_status: z
    .enum(["in_stock", "available_international", "low_stock", "out_of_stock", "sourced"])
    .optional(),
  stock_origin: z.enum(["sa_warehouse", "overseas"]).optional(),
  quantity: z.number().min(0).optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  image_url: z.string().nullable().optional(),
  source_name: z.string().nullable().optional(),
  source_url: z.string().nullable().optional(),
  delivery_days_min: z.number().optional(),
  delivery_days_max: z.number().optional(),
  deal_discount_percent: z.number().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  category: z.string().default("general"),
  base_price: z.number().min(0),
  markup_percent: z.number().min(0).max(500).default(10),
  stock_status: z.enum(["in_stock", "available_international", "low_stock", "out_of_stock", "sourced"]).default("in_stock"),
  stock_origin: z.enum(["sa_warehouse", "overseas"]).default("sa_warehouse"),
  quantity: z.number().min(0).default(10),
  image_url: z.string().optional().nullable(),
  source_name: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
  delivery_days_min: z.number().default(SA_WAREHOUSE_DELIVERY_DAYS.min),
  delivery_days_max: z.number().default(SA_WAREHOUSE_DELIVERY_DAYS.max),
  is_featured: z.boolean().default(false),
  is_deal: z.boolean().default(false),
  show_in_hot: z.boolean().default(false),
  show_in_steals: z.boolean().default(false),
  show_in_fresh_drops: z.boolean().default(false),
  deal_discount_percent: z.number().nullable().optional(),
  retail_price: z.number().min(0).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const retail =
    parsed.data.retail_price ??
    parsed.data.base_price * (1 + parsed.data.markup_percent / 100);

  if (!isSupabaseConfigured()) {
    const product = createCustomProduct({
      ...parsed.data,
      retail_price: Number(retail.toFixed(2)),
      currency: "ZAR",
      image_url: parsed.data.image_url ?? null,
      source_name: parsed.data.source_name ?? null,
      deal_discount_percent: parsed.data.deal_discount_percent ?? null,
      metadata: parsed.data.metadata ?? {},
    });
    return NextResponse.json({ ok: true, demo: true, product });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("products")
      .insert({
        slug: parsed.data.slug,
        name: parsed.data.name,
        description: parsed.data.description,
        category: parsed.data.category as "general",
        base_price: parsed.data.base_price,
        retail_price: Number(retail.toFixed(2)),
        markup_percent: parsed.data.markup_percent,
        stock_status: parsed.data.stock_status,
        image_url: parsed.data.image_url,
        source_name: parsed.data.source_name,
        source_url: parsed.data.source_url,
        delivery_days_min: parsed.data.delivery_days_min,
        delivery_days_max: parsed.data.delivery_days_max,
        is_featured: parsed.data.is_featured,
        is_deal: parsed.data.is_deal,
        show_in_hot: parsed.data.show_in_hot,
        show_in_steals: parsed.data.show_in_steals,
        show_in_fresh_drops: parsed.data.show_in_fresh_drops,
        deal_discount_percent: parsed.data.deal_discount_percent,
        metadata: (parsed.data.metadata ?? {}) as ProductUpdate["metadata"],
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, product: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!staffCan(staff, "products.edit") && !staffCan(staff, "products.markup")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const { id, quantity, stock_origin, metadata, ...rest } = parsed.data;

  const updates = { ...rest } as ProductUpdate;

  // Demo mode: persist to in-memory store so edits survive navigation.
  if (!isSupabaseConfigured()) {
    const patchPayload = {
      ...parsed.data,
      metadata: {
        ...(metadata ?? {}),
        ...(quantity !== undefined ? { quantity } : {}),
        ...(stock_origin !== undefined ? { stock_origin } : {}),
      },
    };
    const product = updateCustomProduct(id, patchPayload as Parameters<typeof updateCustomProduct>[1]);
    if (!product && !id.startsWith("custom-")) {
      return NextResponse.json({ ok: true, demo: true, id, updates: rest });
    }
    return NextResponse.json({ ok: true, demo: true, product: product ?? { id, ...rest } });
  }

  try {
    const supabase = createServiceClient();

    if (metadata !== undefined || quantity !== undefined || stock_origin !== undefined) {
      const { data: existing } = await supabase
        .from("products")
        .select("metadata, base_price, markup_percent")
        .eq("id", id)
        .maybeSingle();

      const merged = {
        ...((existing?.metadata as Record<string, unknown> | null) ?? {}),
        ...((metadata as Record<string, unknown> | undefined) ?? {}),
      };
      if (quantity !== undefined) merged.quantity = quantity;
      if (stock_origin !== undefined) merged.stock_origin = stock_origin;
      updates.metadata = merged as ProductUpdate["metadata"];

      const base = updates.base_price ?? Number(existing?.base_price) ?? 0;
      const markup = updates.markup_percent ?? Number(existing?.markup_percent) ?? 10;
      if (
        updates.retail_price === undefined &&
        (updates.markup_percent !== undefined || updates.base_price !== undefined)
      ) {
        updates.retail_price = Number((base * (1 + markup / 100)).toFixed(2));
      }
    } else if (
      updates.retail_price === undefined &&
      (updates.markup_percent !== undefined || updates.base_price !== undefined)
    ) {
      const { data: existing } = await supabase
        .from("products")
        .select("base_price, markup_percent")
        .eq("id", id)
        .maybeSingle();

      const base = updates.base_price ?? Number(existing?.base_price) ?? 0;
      const markup = updates.markup_percent ?? Number(existing?.markup_percent) ?? 10;
      updates.retail_price = Number((base * (1 + markup / 100)).toFixed(2));
    }

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("staff_activity_log").insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      action: "Updated product pricing",
      entity_type: "product",
      entity_id: id,
      details: updates,
    });

    return NextResponse.json({ ok: true, product: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "products.edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, demo: true, id });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("inventory_records").delete().eq("product_id", id);

    await supabase.from("staff_activity_log").insert({
      staff_id: staff.id,
      staff_name: staff.full_name,
      action: "Removed product",
      entity_type: "product",
      entity_id: id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
