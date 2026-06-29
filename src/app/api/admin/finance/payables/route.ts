import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { createPayable, listPayables, updatePayable } from "@/lib/admin/operations-persistence";

const createSchema = z.object({
  invoiceNumber: z.string().min(2),
  vendor: z.string().min(2),
  category: z.enum(["procurement", "shipping", "marketing", "payroll", "operations", "refunds", "other"]),
  amount: z.number().positive(),
  currency: z.string().default("ZAR"),
  dueDate: z.string(),
  orderNumber: z.string().optional(),
  notes: z.string().optional(),
});

const patchSchema = z.object({
  id: z.string(),
  status: z.enum(["pending", "approved", "paid", "overdue", "cancelled"]).optional(),
});

export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "finance.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ payables: await listPayables() });
}

export async function POST(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "finance.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const payable = await createPayable({ ...parsed.data, status: "pending" });
  return NextResponse.json({ ok: true, payable });
}

export async function PATCH(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "finance.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const patch: Parameters<typeof updatePayable>[1] = {};
  if (parsed.data.status) {
    patch.status = parsed.data.status;
    if (parsed.data.status === "paid") {
      patch.paidAt = new Date().toISOString();
    }
  }
  const payable = await updatePayable(parsed.data.id, patch);
  if (!payable) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, payable });
}
