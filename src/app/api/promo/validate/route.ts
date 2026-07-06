import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  getClientIp,
  logApiRequest,
  rateLimit,
  secureErrorResponse,
  secureJsonResponse,
} from "@/lib/security/api";
import { calculatePromoDiscount, findPromoByCode } from "@/lib/promo/apply-promo";
import { buildProductCategoryMap } from "@/lib/promo/resolve-product-categories";
import { listPromoCodes } from "@/lib/admin/operations-persistence";

const itemSchema = z.object({
  productId: z.string().optional(),
  slug: z.string().optional(),
  price: z.number().positive(),
  quantity: z.number().int().min(1).max(99),
});

const validateSchema = z.object({
  code: z.string().min(2).max(40),
  items: z.array(itemSchema).min(1),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limited = rateLimit(request, 30);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return secureErrorResponse("Invalid JSON body", "INVALID_JSON");
  }

  const parsed = validateSchema.safeParse(body);
  if (!parsed.success) {
    await logApiRequest("/api/promo/validate", "POST", ip, 400);
    return secureErrorResponse(
      parsed.error.issues[0]?.message ?? "Invalid promo request",
      "VALIDATION_ERROR",
    );
  }

  const promos = await listPromoCodes();
  const promo = findPromoByCode(promos, parsed.data.code);
  if (!promo) {
    await logApiRequest("/api/promo/validate", "POST", ip, 404);
    return secureJsonResponse({
      valid: false,
      message: "Promo code not found",
      discountAmount: 0,
      eligibleSubtotal: 0,
      cartSubtotal: parsed.data.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
      discountedSubtotal: parsed.data.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    });
  }

  const categoryByKey = await buildProductCategoryMap();
  const result = calculatePromoDiscount(parsed.data.items, promo, categoryByKey);

  await logApiRequest("/api/promo/validate", "POST", ip, result.valid ? 200 : 400);
  return secureJsonResponse(result);
}
