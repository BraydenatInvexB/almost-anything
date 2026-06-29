import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupportTicket } from "@/lib/admin/operations-persistence";
import { isSupabaseConfigured, createServiceClient } from "@/lib/supabase/admin";

const schema = z.object({
  customer_name: z.string().min(2),
  customer_email: z.string().email(),
  subject: z.string().min(3),
  category: z.string().min(2),
  body: z.string().min(10),
  order_id: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServiceClient();
      const ticketNumber = `TKT-${Date.now().toString().slice(-5)}`;
      const { data: ticket, error } = await supabase
        .from("support_tickets")
        .insert({
          ticket_number: ticketNumber,
          customer_email: parsed.data.customer_email,
          customer_name: parsed.data.customer_name,
          subject: parsed.data.subject,
          category: parsed.data.category,
          status: "open",
          priority: "normal",
          order_id: parsed.data.order_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("ticket_messages").insert({
        ticket_id: ticket.id,
        author_type: "customer",
        author_name: parsed.data.customer_name,
        body: parsed.data.body,
      });

      return NextResponse.json({ ok: true, ticketNumber: ticket.ticket_number, id: ticket.id });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to create ticket" },
        { status: 500 },
      );
    }
  }

  const ticket = createSupportTicket(parsed.data);
  return NextResponse.json({ ok: true, ticketNumber: ticket.ticket_number, id: ticket.id });
}
