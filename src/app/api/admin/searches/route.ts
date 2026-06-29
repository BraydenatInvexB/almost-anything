import { NextRequest } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { secureJsonResponse, secureErrorResponse } from "@/lib/security/api";
import { getSearchAnalyticsSummary } from "@/services/search-analytics-service";

export async function GET(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "searches.view")) {
    return secureErrorResponse("Forbidden", "FORBIDDEN", 403);
  }

  const daysParam = request.nextUrl.searchParams.get("days");
  const days = daysParam === "7" ? 7 : daysParam === "90" ? 90 : 30;

  const summary = await getSearchAnalyticsSummary(days);
  return secureJsonResponse(summary);
}
