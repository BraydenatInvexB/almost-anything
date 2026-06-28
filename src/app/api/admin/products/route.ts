import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { createCustomProduct, updateCustomProduct } from "@/lib/admin/operations-store";
import type { Database } from "@/types/database";

type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

const patchSchema = z.object({
  id: z.string().min(1),
  markup_percent: z.number().min(0).max(500).optional(),
  retail_price: z.number().min(0).optional(),
  base_price: z.number().min(0).optional(),
  is_featured: z.boolean().optional(),
  is_deal: z.boolean().optional(),
  stock_status: z
    .enum(["in_stock", "low_stock", "out_of_stock", "sourced"])
    .optional(),
  stock_origin: z.enum(["sa_warehouse", "overseas"]).optional(),
  quantity: z.number().min(0).optional(),
  name: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  image_url: z.string().nullable().optional(),
  source_name: z.string().nullable().optional(),
  delivery_days_min: z.number().optional(),
  delivery_days_max: z.number().optional(),
});

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  category: z.string().default("general"),
  base_price: z.number().min(0),
  markup_percent: z.number().min(0).max(500).default(18),
  stock_status: z.enum(["in_stock", "low_stock", "out_of_stock", "sourced"]).default("in_stock"),
  stock_origin: z.enum(["sa_warehouse", "overseas"]).default("sa_warehouse"),
  quantity: z.number().min(0).default(10),
  image_url: z.string().optional().nullable(),
  source_name: z.string().optional().nullable(),
  delivery_days_min: z.number().default(3),
  delivery_days_max: z.number().default(7),
  is_featured: z.boolean().default(false),
  is_deal: z.boolean().default(false),
  deal_discount_percent: z.number().nullable().optional(),
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

  const retail = parsed.data.base_price * (1 + parsed.data.markup_percent / 100);

  if (!isSupabaseConfigured()) {
    const product = createCustomProduct({
      ...parsed.data,
      retail_price: Number(retail.toFixed(2)),
      currency: "ZAR",
      image_url: parsed.data.image_url ?? null,
      source_name: parsed.data.source_name ?? null,
      deal_discount_percent: parsed.data.deal_discount_percent ?? null,
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
        delivery_days_min: parsed.data.delivery_days_min,
        delivery_days_max: parsed.data.delivery_days_max,
        is_featured: parsed.data.is_featured,
        is_deal: parsed.data.is_deal,
        deal_discount_percent: parsed.data.deal_discount_percent,
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

  const { id, stock_origin: _origin, quantity: _qty, ...updates } = parsed.data;

  // Demo mode: persist to in-memory store so edits survive navigation.
  if (!isSupabaseConfigured()) {
    const product = updateCustomProduct(id, parsed.data as Parameters<typeof updateCustomProduct>[1]);
    if (!product && !id.startsWith("custom-")) {
      return NextResponse.json({ ok: true, demo: true, id, updates });
    }
    return NextResponse.json({ ok: true, demo: true, product: product ?? { id, ...updates } });
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("products")
      .update(updates as ProductUpdate)
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
