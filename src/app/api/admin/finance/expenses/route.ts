import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { createExpense, listExpenses } from "@/lib/admin/operations-store";

const schema = z.object({
  label: z.string().min(2),
  category: z.enum(["procurement", "shipping", "marketing", "payroll", "operations", "refunds", "other"]),
  amount: z.number().positive(),
  currency: z.string().default("ZAR"),
  vendor: z.string().optional(),
  orderId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "finance.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ expenses: listExpenses() });
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "finance.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const expense = createExpense({
    ...parsed.data,
    recordedBy: staff.full_name,
  });
  return NextResponse.json({ ok: true, expense });
}
