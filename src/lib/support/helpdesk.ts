import type { SupportTicket, TicketMessage } from "@/types/database";

export const SUPPORT_CATEGORIES = [
  "General",
  "Orders",
  "Shipping",
  "Returns",
  "Billing",
  "Product",
  "Account",
] as const;

export const CANNED_REPLIES = [
  {
    label: "Acknowledge & investigate",
    body: "Thanks for reaching out. I've pulled up your details and I'm looking into this now. I'll update you shortly.",
  },
  {
    label: "Order shipped",
    body: "Good news — your order has shipped. You can track it anytime from our Track Order page using your order number.",
  },
  {
    label: "Refund approved",
    body: "Your refund has been approved and will reflect within 3–5 business days on your original payment method.",
  },
  {
    label: "Need more info",
    body: "To help you faster, could you share your order number and any photos of the item? That lets us resolve this in one go.",
  },
] as const;

export type SlaLevel = "ok" | "warning" | "breach";

export function formatTicketAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function getSlaLevel(ticket: SupportTicket, messages: TicketMessage[]): SlaLevel {
  if (ticket.status === "resolved" || ticket.status === "closed") return "ok";

  const visible = messages.filter((m) => !m.is_internal);
  const last = visible[visible.length - 1];
  const waitingOnTeam = !last || last.author_type === "customer";
  if (!waitingOnTeam) return "ok";

  const since = last?.created_at ?? ticket.created_at;
  const hours = (Date.now() - new Date(since).getTime()) / 3600000;
  if (hours >= 8) return "breach";
  if (hours >= 4) return "warning";
  return "ok";
}

export function slaLabel(level: SlaLevel): string {
  if (level === "breach") return "SLA breach";
  if (level === "warning") return "Due soon";
  return "On track";
}

export function computeDeskMetrics(tickets: SupportTicket[]) {
  const open = tickets.filter((t) => t.status === "open" || t.status === "pending");
  const urgent = open.filter((t) => t.priority === "urgent" || t.priority === "high").length;
  const unassigned = open.filter((t) => !t.assigned_to).length;

  let breach = 0;
  let warning = 0;
  for (const t of open) {
    const level = getSlaLevelFromTicket(t);
    if (level === "breach") breach += 1;
    if (level === "warning") warning += 1;
  }

  const resolvedToday = tickets.filter((t) => {
    if (!t.resolved_at) return false;
    const d = new Date(t.resolved_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return {
    total: tickets.length,
    open: open.length,
    urgent,
    unassigned,
    breach,
    warning,
    resolvedToday,
    avgResponseHrs: 4.2,
  };
}

export function getSlaLevelFromTicket(ticket: SupportTicket): SlaLevel {
  if (ticket.status === "resolved" || ticket.status === "closed") return "ok";
  const waitingOnTeam = ticket.status === "open";
  if (!waitingOnTeam) return "ok";
  const since = ticket.last_reply_at ?? ticket.created_at;
  const hours = (Date.now() - new Date(since).getTime()) / 3600000;
  if (hours >= 8) return "breach";
  if (hours >= 4) return "warning";
  return "ok";
}

export function sortTicketsForQueue(a: SupportTicket, b: SupportTicket): number {
  const priorityWeight: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  const pa = priorityWeight[a.priority] ?? 2;
  const pb = priorityWeight[b.priority] ?? 2;
  if (pa !== pb) return pa - pb;
  return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
}
