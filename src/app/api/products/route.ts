import { NextRequest } from "next/server";
import {
  rateLimit,
  secureJsonResponse,
  secureErrorResponse,
  searchQuerySchema,
  getClientIp,
  logApiRequest,
} from "@/lib/security/api";
import { getProducts } from "@/services/product-service";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request);
  if (limited) {
    await logApiRequest("/api/products", "GET", ip, 429);
    return limited;
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = searchQuerySchema.safeParse(params);

  if (!parsed.success) {
    await logApiRequest("/api/products", "GET", ip, 400);
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid query",
      "VALIDATION_ERROR",
    );
  }

  const { q, category, page, pageSize } = parsed.data;

  try {
    const result = await getProducts({
      query: q,
      category: category ?? undefined,
      page,
      pageSize,
    });

    await logApiRequest("/api/products", "GET", ip, 200);
    return secureJsonResponse(result);
  } catch {
    await logApiRequest("/api/products", "GET", ip, 500);
    return secureErrorResponse("Failed to fetch products", "INTERNAL_ERROR", 500);
  }
}
