import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { listProcurement, updateProcurement } from "@/lib/admin/operations-store";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ procurement: listProcurement() });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "procurement.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const record = updateProcurement(body.id, body);
  return NextResponse.json({ ok: true, record });
}
