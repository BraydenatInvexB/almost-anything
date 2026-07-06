import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff, resetSellerPassword } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const result = await resetSellerPassword({
      sellerId: id,
      email: parsed.data.email,
      staffId: staff.id,
      staffName: staff.full_name,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reset failed" },
      { status: 400 },
    );
  }
}
