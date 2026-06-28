import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { addTicketMessage, updateSupportTicket } from "@/lib/admin/operations-store";

const schema = z.object({
  body: z.string().min(1).max(5000),
  is_internal: z.boolean().default(false),
  resolve: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!staffCan(staff, "support.manage")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const message = addTicketMessage(id, {
      author_type: "staff",
      author_id: staff.id,
      author_name: staff.full_name,
      body: parsed.data.body,
      is_internal: parsed.data.is_internal,
    });
    if (!message) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (parsed.data.resolve && !parsed.data.is_internal) {
      updateSupportTicket(id, { status: "resolved" });
    }

    return NextResponse.json({ ok: true, message });
  }

  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id: id,
      author_type: "staff",
      author_id: staff.id,
      author_name: staff.full_name,
      body: parsed.data.body,
      is_internal: parsed.data.is_internal,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const statusUpdate =
      parsed.data.resolve && !parsed.data.is_internal
        ? "resolved"
        : parsed.data.is_internal
          ? undefined
          : "pending";

    await supabase
      .from("support_tickets")
      .update({
        last_reply_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(statusUpdate ? { status: statusUpdate } : {}),
        ...(parsed.data.resolve && !parsed.data.is_internal
          ? { resolved_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Server error" },
      { status: 500 },
    );
  }
}
