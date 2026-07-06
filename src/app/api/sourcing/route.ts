import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { sourcingRequestSchema } from "@/lib/validation/checkout";
import { submitItemRequest } from "@/services/sourcing-request-service";
import { enqueueSourcingRun, logSearchEvent } from "@/services/search-analytics-service";

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

  try {
    const itemRequest = await submitItemRequest({
      query: parsed.data.query,
      email: parsed.data.email,
      budget: parsed.data.budget,
      urgency: parsed.data.urgency,
    });

    void logSearchEvent({
      query: parsed.data.query,
      inputMethod: "request",
      source: "item_request",
      metadata: {
        requestId: itemRequest.id,
        budget: parsed.data.budget ?? null,
        urgency: parsed.data.urgency,
      },
    });

    void enqueueSourcingRun({
      requestId: itemRequest.id,
      query: parsed.data.query,
      inputMethod: "request",
    });

    await logApiRequest("/api/sourcing", "POST", ip, 200);
    return secureJsonResponse({
      requestId: itemRequest.id,
      requestNumber: itemRequest.requestNumber,
      status: itemRequest.status,
      message:
        "Your request has been submitted. We'll confirm availability and pricing shortly.",
    });
  } catch {
    await logApiRequest("/api/sourcing", "POST", ip, 500);
    return secureErrorResponse("Sourcing request failed", "INTERNAL_ERROR", 500);
  }
}
