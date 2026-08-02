import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { updateDeliveryJobStatus } from "@/services/delivery/jobs";

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    "pending",
    "awaiting_seller",
    "ready_for_driver",
    "assigned",
    "collecting",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ]),
  driverId: z.string().uuid().nullable().optional(),
});

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "orders.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const result = await updateDeliveryJobStatus(parsed.data.id, parsed.data.status, {
    driverId: parsed.data.driverId,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
