import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { sourcingRequestSchema } from "@/lib/validation/checkout";
import { generateQuoteOptions } from "@/lib/ai/quote-generator";
import { generateRequestId } from "@/lib/utils/cn";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 10);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = sourcingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid request",
      "VALIDATION_ERROR",
    );
  }

  const requestId = generateRequestId();

  try {
    const quote = generateQuoteOptions(
      {
        query: parsed.data.query,
        budget: parsed.data.budget,
        urgency: parsed.data.urgency,
      },
      requestId,
    );

    if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createServiceClient();
      await supabase.from("customer_requests").insert({
        id: requestId,
        query: parsed.data.query,
        parsed_intent: quote.parsedIntent,
        status: "searching",
      });

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

    await logApiRequest("/api/sourcing", "POST", ip, 200);
    return secureJsonResponse({
      requestId,
      status: "searching",
      message:
        "Your sourcing request has been submitted. We're searching suppliers now.",
      quoteUrl: `/quote?requestId=${requestId}`,
      quote,
    });
  } catch {
    await logApiRequest("/api/sourcing", "POST", ip, 500);
    return secureErrorResponse("Sourcing request failed", "INTERNAL_ERROR", 500);
  }
}
