import { state, ticketNum } from "@/lib/admin/operations-store-core";
import type { SupportTicket, TicketMessage } from "@/types/database";

export function listOpsTickets() {
  return state.tickets;
}

export function getOpsTicketMessages(ticketId: string) {
  return state.ticketMessages[ticketId] ?? [];
}

export function addTicketMessage(
  ticketId: string,
  input: {
    author_type: "staff" | "customer";
    author_id?: string | null;
    author_name: string;
    body: string;
    is_internal?: boolean;
  },
) {
  const idx = state.tickets.findIndex((t) => t.id === ticketId);
  if (idx < 0) return null;

  const now = new Date().toISOString();
  const message: TicketMessage = {
    id: `msg-${Date.now()}`,
    ticket_id: ticketId,
    author_type: input.author_type,
    author_id: input.author_id ?? null,
    author_name: input.author_name,
    body: input.body,
    is_internal: input.is_internal ?? false,
    created_at: now,
  };

  if (!state.ticketMessages[ticketId]) state.ticketMessages[ticketId] = [];
  state.ticketMessages[ticketId].push(message);

  const ticket = state.tickets[idx];
  ticket.last_reply_at = now;
  ticket.updated_at = now;

  if (input.author_type === "staff" && !input.is_internal && ticket.status === "open") {
    ticket.status = "pending";
  }

  return message;
}

export function updateSupportTicket(
  id: string,
  patch: Partial<Pick<SupportTicket, "status" | "priority" | "assigned_to" | "category">>,
) {
  const idx = state.tickets.findIndex((t) => t.id === id);
  if (idx < 0) return null;

  const ticket = state.tickets[idx];
  const now = new Date().toISOString();
  state.tickets[idx] = {
    ...ticket,
    ...patch,
    updated_at: now,
    resolved_at:
      patch.status === "resolved" || patch.status === "closed"
        ? now
        : patch.status === "open" || patch.status === "pending"
          ? null
          : ticket.resolved_at,
  };
  return state.tickets[idx];
}

export function createSupportTicket(input: {
  customer_email: string;
  customer_name: string;
  subject: string;
  category: string;
  body: string;
  order_id?: string;
  priority?: SupportTicket["priority"];
}) {
  const id = `tkt-${Date.now()}`;
  const ticket: SupportTicket = {
    id,
    ticket_number: ticketNum(),
    customer_id: null,
    customer_email: input.customer_email,
    customer_name: input.customer_name,
    subject: input.subject,
    category: input.category,
    status: "open",
    priority: input.priority ?? "normal",
    assigned_to: null,
    order_id: input.order_id ?? null,
    last_reply_at: new Date().toISOString(),
    resolved_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  state.tickets.unshift(ticket);
  state.ticketMessages[id] = [
    {
      id: `msg-${Date.now()}`,
      ticket_id: id,
      author_type: "customer",
      author_id: null,
      author_name: input.customer_name,
      body: input.body,
      is_internal: false,
      created_at: new Date().toISOString(),
    },
  ];
  return ticket;
}
