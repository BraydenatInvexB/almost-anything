import { createServiceClient } from "@/lib/supabase/admin";

export function sellerDb() {
  return createServiceClient();
}
