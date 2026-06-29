import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { listProcurement, updateProcurement, receiveProcurement } from "@/lib/admin/operations-persistence";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ procurement: await listProcurement() });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { id, status, supplierOrderRef, inboundTracking, expectedAt, notes, orderedAt, supplier, costPrice, actualCostPaid } = body as {
    id: string;
    status?: string;
    supplierOrderRef?: string;
    inboundTracking?: string;
    expectedAt?: string;
    notes?: string;
    orderedAt?: string;
    supplier?: string;
    costPrice?: number;
    actualCostPaid?: number;
  };

  if (status === "received") {
    const record = await receiveProcurement(id);
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, record });
  }

  const record = await updateProcurement(id, {
    ...(status ? { status: status as import("@/lib/admin/operations-types").ProcurementStatus } : {}),
    supplier,
    supplierOrderRef,
    inboundTracking,
    expectedAt,
    notes,
    orderedAt: status === "ordered" ? new Date().toISOString() : orderedAt,
    ...(costPrice != null ? { costPrice } : {}),
    ...(actualCostPaid != null ? { actualCostPaid } : {}),
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, record });
}
