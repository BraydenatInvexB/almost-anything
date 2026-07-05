import type { StockOrigin } from "@/lib/admin/operations-types";
import { createServiceClient } from "@/lib/supabase/admin";

export function db() {
  return createServiceClient();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tbl(name: string) {
  return db().from(name as any);
}

export function asRows(data: unknown): Record<string, unknown>[] {
  return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
}

export function asRow(data: unknown): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>;
}

export const DEFAULT_SUPPLIERS: Record<StockOrigin, { name: string; country: string }> = {
  overseas: { name: "International warehouse hub", country: "Netherlands" },
  sa_warehouse: { name: "Johannesburg DC", country: "South Africa" },
};
