import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff, listSellerMessages, sendAdminMessageToSeller } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const messages = await listSellerMessages(id);
  return NextResponse.json({ messages });
}

const postSchema = z.object({
  subject: z.string().min(3).max(120),
  body: z.string().min(5).max(4000),
  priority: z.enum(["normal", "important", "action_required"]).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { id } = await context.params;
  const message = await sendAdminMessageToSeller({
    sellerId: id,
    staffName: staff.full_name,
    subject: parsed.data.subject,
    body: parsed.data.body,
    priority: parsed.data.priority,
  });

  return NextResponse.json({ ok: true, message });
}
