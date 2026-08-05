import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentDriver } from "@/services/delivery/drivers";
import {
  claimDeliveryJob,
  getDeliveryJob,
  updateDeliveryJobStatus,
} from "@/services/delivery/jobs";

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("claim"),
    id: z.string().uuid(),
  }),
  z.object({
    action: z.literal("status"),
    id: z.string().uuid(),
    status: z.enum(["collecting", "out_for_delivery"]),
  }),
  z.object({
    action: z.literal("complete"),
    id: z.string().uuid(),
    recipientName: z.string().trim().min(2).max(120),
    signatureDataUrl: z.string().startsWith("data:image/png;base64,").max(250_000),
  }),
]);

export async function PATCH(request: Request) {
  const driver = await getCurrentDriver();
  if (!driver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (driver.status !== "active") {
    return NextResponse.json({ error: "Your driver account is not active." }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.action === "claim") {
    const result = await claimDeliveryJob(parsed.data.id, driver);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const job = await getDeliveryJob(parsed.data.id);
  if (!job || job.driverId !== driver.id) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
  }

  const nextStatus = parsed.data.action === "complete" ? "delivered" : parsed.data.status;
  const allowed =
    (job.status === "assigned" && nextStatus === "collecting") ||
    (job.status === "collecting" && nextStatus === "out_for_delivery") ||
    (job.status === "out_for_delivery" && nextStatus === "delivered");
  if (!allowed) return NextResponse.json({ error: "Complete the delivery steps in order." }, { status: 400 });

  const result = await updateDeliveryJobStatus(parsed.data.id, nextStatus, {
    driverId: driver.id,
    proofOfDelivery: parsed.data.action === "complete"
      ? { recipientName: parsed.data.recipientName, signatureDataUrl: parsed.data.signatureDataUrl }
      : undefined,
  });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
