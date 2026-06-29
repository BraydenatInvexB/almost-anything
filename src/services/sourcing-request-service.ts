import {
  createItemRequest,
  listItemRequests,
} from "@/lib/admin/operations-persistence";
import type { CustomerItemRequest, ItemRequestUrgency } from "@/lib/admin/operations-types";
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

  const { isSupabaseConfigured } = await import("@/lib/supabase/admin");
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      /* optional auth */
    }
  }

  return createItemRequest({
    id: requestId,
    query: input.query,
    customerEmail: input.email,
    budget: input.budget,
    urgency: input.urgency,
    userId,
  });
}

export async function listAllItemRequests(): Promise<CustomerItemRequest[]> {
  return listItemRequests();
}

export async function countOpenItemRequests(): Promise<number> {
  const requests = await listItemRequests();
  return requests.filter((r) => !["delivered", "failed"].includes(r.status)).length;
}
