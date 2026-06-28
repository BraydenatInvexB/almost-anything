import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  quoteRequestSchema,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { generateQuoteOptions } from "@/lib/ai/quote-generator";
import { generateRequestId } from "@/lib/utils/cn";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 20);
  if (limited) {
    await logApiRequest("/api/quotes", "POST", ip, 429);
    return limited;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    await logApiRequest("/api/quotes", "POST", ip, 400);
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = quoteRequestSchema.safeParse(body);
  if (!parsed.success) {
    await logApiRequest("/api/quotes", "POST", ip, 400);
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid request",
      "VALIDATION_ERROR",
    );
  }

  const requestId = generateRequestId();

  try {
    const quote = generateQuoteOptions(parsed.data, requestId);

    if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createServiceClient();

      const { data: customerRequest } = await supabase
        .from("customer_requests")
        .insert({
          id: requestId,
          query: parsed.data.query,
          parsed_intent: quote.parsedIntent,
          status: "quoted",
        })
        .select()
        .single();

      if (customerRequest) {
        await supabase.from("quote_options").insert(
          quote.options.map((option) => ({
            request_id: requestId,
            tier: option.tier,
            product_name: option.productName,
            supplier_name: option.supplierName,
            base_price: option.basePrice,
            retail_price: option.retailPrice,
            delivery_days: option.deliveryDays,
            quality_score: option.qualityScore,
            rating: option.rating,
            image_url: option.imageUrl,
          })),
        );
      }
    }

    await logApiRequest("/api/quotes", "POST", ip, 200);
    return secureJsonResponse(quote);
  } catch {
    await logApiRequest("/api/quotes", "POST", ip, 500);
    return secureErrorResponse("Failed to generate quote", "INTERNAL_ERROR", 500);
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const requestId = request.nextUrl.searchParams.get("requestId");

  if (!requestId) {
    return secureErrorResponse("requestId is required", "VALIDATION_ERROR");
  }

  if (!isSupabaseConfigured()) {
    return secureErrorResponse("Quote not found", "NOT_FOUND", 404);
  }

  try {
    const supabase = createServiceClient();
    const { data: options, error } = await supabase
      .from("quote_options")
      .select("*")
      .eq("request_id", requestId);

    if (error || !options?.length) {
      await logApiRequest("/api/quotes", "GET", ip, 404);
      return secureErrorResponse("Quote not found", "NOT_FOUND", 404);
    }

    await logApiRequest("/api/quotes", "GET", ip, 200);
    return secureJsonResponse({ requestId, options });
  } catch {
    await logApiRequest("/api/quotes", "GET", ip, 500);
    return secureErrorResponse("Failed to fetch quote", "INTERNAL_ERROR", 500);
  }
}
