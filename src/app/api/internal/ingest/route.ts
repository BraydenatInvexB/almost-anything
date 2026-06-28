import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  requireInternalAuth,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/admin";
import { calculateMarkup } from "@/lib/markup/engine";
import type { Database } from "@/types/database";
import { z } from "zod";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];

const ingestSchema = z.object({
  products: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      description: z.string().optional(),
      category: z.string(),
      base_price: z.number().positive(),
      image_url: z.string().url().optional(),
      enhanced_image_url: z.string().url().optional(),
      source_url: z.string().url(),
      source_name: z.string(),
      delivery_days_min: z.number().int().optional(),
      delivery_days_max: z.number().int().optional(),
      rating: z.number().optional(),
      review_count: z.number().int().optional(),
      is_featured: z.boolean().optional(),
      is_exclusive: z.boolean().optional(),
      is_deal: z.boolean().optional(),
      deal_discount_percent: z.number().optional(),
    }),
  ),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const authError = requireInternalAuth(request);
  if (authError) {
    await logApiRequest("/api/internal/ingest", "POST", ip, 401);
    return authError;
  }

  const limited = rateLimit(request, 30);
  if (limited) return limited;

  if (!isSupabaseConfigured()) {
    return secureErrorResponse(
      "Supabase not configured",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = ingestSchema.safeParse(body);
  if (!parsed.success) {
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid payload",
      "VALIDATION_ERROR",
    );
  }

  try {
    const supabase = createServiceClient();
    const records: ProductInsert[] = parsed.data.products.map((product) => {
      const markup = calculateMarkup({
        basePrice: product.base_price,
        category: product.category,
        supplierRating: product.rating,
        isExclusive: product.is_exclusive,
      });

      return {
        slug: product.slug,
        name: product.name,
        description: product.description ?? null,
        category: product.category as ProductInsert["category"],
        base_price: markup.basePrice,
        retail_price: markup.retailPrice,
        markup_percent: markup.markupPercent,
        image_url: product.image_url ?? null,
        enhanced_image_url: product.enhanced_image_url ?? null,
        source_url: product.source_url,
        source_name: product.source_name,
        delivery_days_min: product.delivery_days_min ?? 5,
        delivery_days_max: product.delivery_days_max ?? 14,
        rating: product.rating ?? 4.5,
        review_count: product.review_count ?? 0,
        is_featured: product.is_featured ?? false,
        is_exclusive: product.is_exclusive ?? false,
        is_deal: product.is_deal ?? false,
        deal_discount_percent: product.deal_discount_percent ?? null,
        stock_status: "sourced",
      };
    });

    const { data, error } = await supabase
      .from("products")
      .upsert(records, { onConflict: "slug" })
      .select();

    if (error) throw error;

    await logApiRequest("/api/internal/ingest", "POST", ip, 200);
    return secureJsonResponse({
      success: true,
      ingested: data?.length ?? 0,
    });
  } catch {
    await logApiRequest("/api/internal/ingest", "POST", ip, 500);
    return secureErrorResponse("Ingestion failed", "INTERNAL_ERROR", 500);
  }
}
