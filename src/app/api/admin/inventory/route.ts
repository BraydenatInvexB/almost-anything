import { NextResponse } from "next/server";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { listInventory, updateInventory } from "@/lib/admin/operations-persistence";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "inventory.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ inventory: await listInventory() });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "inventory.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.productId) return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  const record = await updateInventory(body.productId, body);
  return NextResponse.json({ ok: true, record });
}
