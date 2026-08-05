import "server-only";

import { createServiceClient } from "@/lib/supabase/admin";
import { parseDeliverySize } from "@/lib/delivery/size";

export interface DriverPayoutSummary {
  earned: number;
  committed: number;
  paid: number;
  available: number;
  requests: Array<{ id: string; amount: number; status: string; requestedAt: string }>;
}

const db = () => createServiceClient() as any;

export async function getDriverPayoutSummary(driverId: string): Promise<DriverPayoutSummary> {
  const supabase = db();
  const [{ data: jobs }, { data: payouts }] = await Promise.all([
    supabase.from("delivery_jobs").select("metadata").eq("driver_id", driverId).eq("status", "delivered"),
    supabase.from("driver_payout_requests").select("*").eq("driver_id", driverId).order("requested_at", { ascending: false }),
  ]);
  const earned = (jobs ?? []).reduce((total: number, job: any) => {
    const meta = job.metadata && typeof job.metadata === "object" ? job.metadata : {};
    const size = parseDeliverySize(meta.deliverySize ?? meta.delivery_size);
    return total + (size === "large" || size === "bulky" ? 200 : 100);
  }, 0);
  const requests: DriverPayoutSummary["requests"] = (payouts ?? []).map((payout: any) => ({
    id: payout.id,
    amount: Number(payout.amount),
    status: payout.status,
    requestedAt: payout.requested_at,
  }));
  const committed = requests.filter((request) => request.status !== "rejected")
    .reduce((total, request) => total + request.amount, 0);
  const paid = requests.filter((request) => request.status === "paid")
    .reduce((total, request) => total + request.amount, 0);
  return { earned, committed, paid, available: Math.max(0, earned - committed), requests };
}

export async function requestDriverPayout(driverId: string, amount: number) {
  const summary = await getDriverPayoutSummary(driverId);
  if (amount <= 0 || amount > summary.available) {
    return { error: `You can request up to R ${summary.available.toFixed(2)}.` };
  }
  const { error } = await db().from("driver_payout_requests").insert({ driver_id: driverId, amount, status: "pending" });
  return error ? { error: error.message } : { ok: true } as const;
}
