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
import { extractProductIntelligence } from "@/lib/sourcing/product-intelligence";

const schema = z.object({
  query: z.string().min(2).max(500),
  debug: z.boolean().optional(),
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

  try {
    if (parsed.data.debug) {
      const drafts = await extractProductIntelligence(parsed.data.query);
      return secureJsonResponse({
        query: parsed.data.query,
        drafts: drafts.length,
        draftNames: drafts.map((d) => d.name),
        draftPrices: drafts.map((d) => d.basePrice),
      });
    }
    const result = await Promise.race([
      discoverAndIngestProducts(parsed.data.query),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("DISCOVERY_TIMEOUT")), 180_000);
      }),
    ]);
    await logApiRequest("/api/sourcing/discover", "POST", ip, 200);
    return secureJsonResponse(result);
  } catch (err) {
    const timedOut = err instanceof Error && err.message === "DISCOVERY_TIMEOUT";
    await logApiRequest("/api/sourcing/discover", "POST", ip, timedOut ? 504 : 500);
    if (timedOut) {
      return secureErrorResponse("Discovery timed out — try a more specific search", "TIMEOUT", 504);
    }
    return secureErrorResponse("Discovery failed", "INTERNAL_ERROR", 500);
  }
}
