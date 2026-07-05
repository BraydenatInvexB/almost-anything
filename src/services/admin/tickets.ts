import { createClient } from "@/lib/supabase/server";
import { getOpsTicketMessages, listOpsTickets } from "@/lib/admin/operations-store";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { SupportTicket, TicketMessage } from "@/types/database";

export async function listTickets(): Promise<SupportTicket[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length) return data as SupportTicket[];
    } catch {
      /* fall through */
    }
  }
  return listOpsTickets();
}

export async function getTicket(
  id: string,
): Promise<{ ticket: SupportTicket; messages: TicketMessage[] } | null> {
  const tickets = await listTickets();
  const ticket = tickets.find((t) => t.id === id || t.ticket_number === id);
  if (!ticket) return null;

  let messages: TicketMessage[] = getOpsTicketMessages(ticket.id);
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });
      if (data) messages = data as TicketMessage[];
    } catch {
      /* fall through */
    }
  }
  return { ticket, messages };
}
