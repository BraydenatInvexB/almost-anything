import { NextRequest } from "next/server";
import { z } from "zod";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { discoverAndIngestProducts } from "@/lib/sourcing/discovery-engine";

const schema = z.object({
  query: z.string().min(2).max(500),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 20);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid request",
      "VALIDATION_ERROR",
    );
  }

  const result = await discoverAndIngestProducts(parsed.data.query);
  await logApiRequest("/api/sourcing/discover", "POST", ip, 200);
  return secureJsonResponse({
    ...result,
    message: "Product discovery is disabled. Search only matches products already in the catalog.",
  });
}
