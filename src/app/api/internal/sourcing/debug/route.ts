import { NextRequest } from "next/server";
import { requireInternalAuth, secureJsonResponse } from "@/lib/security/api";

/** Legacy debug endpoint — automated discovery pipeline has been removed. */
export async function POST(request: NextRequest) {
  const authError = requireInternalAuth(request);
  if (authError) return authError;

  let query = "";
  try {
    const body = await request.json();
    query = typeof body?.query === "string" ? body.query : "";
  } catch {
    return secureJsonResponse({ error: "query required" }, 400);
  }

  if (!query.trim()) {
    return secureJsonResponse({ error: "query required" }, 400);
  }

  return secureJsonResponse({
    query,
    disabled: true,
    message:
      "Automated product discovery is disabled. Storefront search only matches products already listed in the catalog.",
  });
}
