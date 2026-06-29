import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import {
  addReturnNote,
  createExpense,
  getReturn,
  listReturns,
  updateReturn,
} from "@/lib/admin/operations-persistence";
import { computeRefundAmount } from "@/lib/returns/returns";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ returns: await listReturns() });
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.orderNumber || !body?.customerEmail || !body?.reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { submitReturnRequest } = await import("@/services/return-service");
  const result = await submitReturnRequest({
    orderNumber: body.orderNumber,
    customerEmail: body.customerEmail,
    customerName: body.customerName,
    reasonCode: body.reasonCode ?? "other",
    reason: body.reason,
    method: body.method ?? "courier_pickup",
    itemIds: body.itemIds,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await addReturnNote(result.return.id, {
    body: `Return opened by ${staff.full_name} on behalf of customer.`,
    authorName: staff.full_name,
    authorType: "staff",
    isInternal: true,
  });

  return NextResponse.json({ ok: true, return: await getReturn(result.return.id) });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await getReturn(body.id);
  if (!existing) return NextResponse.json({ error: "Return not found" }, { status: 404 });

  const patch: Parameters<typeof updateReturn>[1] = {};
  if (body.status) patch.status = body.status;
  if (body.refundAmount != null) patch.refundAmount = body.refundAmount;
  if (body.status === "refunded") patch.resolvedAt = new Date().toISOString();
  if (body.status === "rejected") {
    patch.resolvedAt = new Date().toISOString();
    patch.rejectionReason = body.rejectionReason;
  }
  if (body.status === "approved") patch.approvedAt = new Date().toISOString();
  if (body.status === "received") patch.receivedAt = new Date().toISOString();

  const updated = await updateReturn(body.id, patch);

  if (body.status === "refunded") {
    const amount = body.refundAmount ?? updated?.refundAmount ?? computeRefundAmount(existing.items);
    if (amount > 0) {
      await createExpense({
        label: `Refund ${updated?.rmaNumber ?? updated?.orderNumber ?? body.id}`,
        category: "refunds",
        amount,
        currency: updated?.currency ?? "ZAR",
        orderId: updated?.orderId,
        recordedBy: staff.full_name,
        notes: `RMA ${updated?.rmaNumber}`,
      });
    }
  }

  return NextResponse.json({ ok: true, return: updated });
}
