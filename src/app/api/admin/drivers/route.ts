import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { updateDriverStatus } from "@/services/delivery/drivers";
import { reviewDriverDocument } from "@/services/delivery/compliance";
import { createServiceClient } from "@/lib/supabase/admin";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("driver_status"), id: z.string().uuid(), status: z.enum(["pending", "active", "suspended", "rejected"]) }),
  z.object({ action: z.literal("document_status"), documentId: z.string().uuid(), status: z.enum(["approved", "rejected"]) }),
  z.object({ action: z.literal("payout_status"), payoutId: z.string().uuid(), status: z.enum(["approved", "paid", "rejected"]) }),
]);

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "orders.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (raw && !raw.action && raw.id && raw.status) raw.action = "driver_status";
  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (parsed.data.action === "document_status") {
    const result = await reviewDriverDocument(parsed.data.documentId, parsed.data.status);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (parsed.data.action === "payout_status") {
    const { error } = await (createServiceClient() as any).from("driver_payout_requests").update({
      status: parsed.data.status,
      processed_at: new Date().toISOString(),
    }).eq("id", parsed.data.payoutId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  const result = await updateDriverStatus(parsed.data.id, parsed.data.status);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
