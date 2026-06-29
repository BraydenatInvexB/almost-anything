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
import { logSearchEvent } from "@/services/search-analytics-service";

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

  const { q, slugs, category, page, pageSize } = parsed.data;
  const slugList = slugs
    ? slugs.split(",").map((s) => s.trim()).filter(Boolean)
  : undefined;

  try {
    const result = await getProducts({
      query: q,
      slugs: slugList,
      category: category ?? undefined,
      page,
      pageSize,
    });

    if (q?.trim()) {
      void logSearchEvent({
        query: q.trim(),
        inputMethod: "text",
        source: "products_api",
        resultCount: result.total,
        metadata: { category: category ?? null, page },
      });
    }

    await logApiRequest("/api/products", "GET", ip, 200);
    return secureJsonResponse(result);
  } catch {
    await logApiRequest("/api/products", "GET", ip, 500);
    return secureErrorResponse("Failed to fetch products", "INTERNAL_ERROR", 500);
  }
}
