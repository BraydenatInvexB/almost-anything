import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { listReturns, updateReturn } from "@/lib/admin/operations-store";
import { createExpense } from "@/lib/admin/operations-store";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ returns: listReturns() });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "returns.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = updateReturn(body.id, {
    status: body.status,
    refundAmount: body.refundAmount,
    resolvedAt: body.status === "refunded" ? new Date().toISOString() : undefined,
  });

  if (body.status === "refunded" && body.refundAmount > 0) {
    createExpense({
      label: `Refund ${updated?.orderNumber ?? body.id}`,
      category: "refunds",
      amount: body.refundAmount,
      currency: updated?.currency ?? "ZAR",
      orderId: updated?.orderId,
      recordedBy: staff.full_name,
      notes: "Auto-recorded from return processing",
    });
  }

  return NextResponse.json({ ok: true, return: updated });
}
