import { NextRequest, NextResponse } from "next/server";
import { getCurrentStaff, listAllSellers, getSellerAdminDetail, updateSellerStatus, updatePayoutStatus } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { z } from "zod";

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sellers = await listAllSellers();
  return NextResponse.json({ sellers });
}

const patchSchema = z.object({
  id: z.string(),
  action: z.enum(["approve", "suspend", "reject"]),
  notes: z.string().optional(),
});

export async function PATCH(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const statusMap = {
    approve: "approved",
    suspend: "suspended",
    reject: "rejected",
  } as const;

  await updateSellerStatus(parsed.data.id, statusMap[parsed.data.action], parsed.data.notes);
  const detail = await getSellerAdminDetail(parsed.data.id);
  return NextResponse.json({ ok: true, ...detail });
}

const payoutSchema = z.object({
  payoutId: z.string(),
  status: z.enum(["approved", "paid", "rejected"]),
});

export async function POST(request: NextRequest) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = payoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await updatePayoutStatus(parsed.data.payoutId, parsed.data.status, staff.user_id ?? undefined);
  return NextResponse.json({ ok: true });
}
