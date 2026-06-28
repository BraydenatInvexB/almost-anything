import {
  createItemRequest,
  listItemRequests,
} from "@/lib/admin/operations-store";
import type { CustomerItemRequest, ItemRequestUrgency } from "@/lib/admin/operations-types";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateRequestId } from "@/lib/utils/cn";

export interface SubmitItemRequestInput {
  query: string;
  email?: string;
  budget?: number;
  urgency?: ItemRequestUrgency;
}

export async function submitItemRequest(
  input: SubmitItemRequestInput,
): Promise<CustomerItemRequest> {
  const requestId = generateRequestId();
  let userId: string | undefined;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      /* optional auth */
    }
  }

  const parsedIntent = {
    query: input.query,
    keywords: input.query
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 12),
    budget: input.budget ?? null,
    email: input.email ?? null,
    urgency: input.urgency ?? "standard",
  };

  const request = createItemRequest({
    id: requestId,
    query: input.query,
    customerEmail: input.email,
    budget: input.budget,
    urgency: input.urgency,
    userId,
  });

  if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServiceClient();
      await supabase.from("customer_requests").insert({
        id: requestId,
        user_id: userId ?? null,
        query: input.query,
        parsed_intent: parsedIntent,
        status: "searching",
      });
    } catch {
      /* demo store is source of truth when Supabase write fails */
    }
  }

  return request;
}

export function listAllItemRequests(): CustomerItemRequest[] {
  return listItemRequests();
}

export function countOpenItemRequests(): number {
  return listItemRequests().filter(
    (r) => !["delivered", "failed"].includes(r.status),
  ).length;
}
