import type { EmailAudience } from "@/lib/admin/operations-types";

export const AUDIENCE_LABELS: Record<EmailAudience, string> = {
  all: "Everyone (subscribers + customers)",
  subscribers: "Newsletter subscribers only",
  customers: "All customers",
  vip: "VIP customers",
  active_customers: "Customers with recent orders",
};
