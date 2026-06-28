import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, Package, ExternalLink } from "lucide-react";
import { getCurrentStaff, getTicket, listStaff, listCustomers } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { TicketReply } from "@/components/admin/TicketReply";
import { TicketActionsPanel } from "@/components/admin/TicketActionsPanel";
import {
  formatTicketAge,
  getSlaLevel,
  slaLabel,
} from "@/lib/support/helpdesk";
import { cn } from "@/lib/utils/cn";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "support.view")) return <AccessDenied feature="support" />;

  const { id } = await params;
  const result = await getTicket(id);
  if (!result) notFound();

  const { ticket, messages } = result;
  const [team, customers] = await Promise.all([listStaff(), listCustomers()]);
  const customerRecord = customers.find(
    (c) => c.email.toLowerCase() === ticket.customer_email?.toLowerCase(),
  );
  const assignee = ticket.assigned_to
    ? team.find((s) => s.id === ticket.assigned_to)?.full_name
    : null;
  const canManage = staffCan(staff, "support.manage");
  const sla = getSlaLevel(ticket, messages);
  const publicMessages = messages.filter((m) => !m.is_internal);

  return (
    <>
      <PageHeader
        title={ticket.subject}
        subtitle={`${ticket.ticket_number} · ${ticket.category} · opened ${formatTicketAge(ticket.created_at)}`}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Support", href: "/admin/support" },
          { label: ticket.ticket_number },
        ]}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
            {(ticket.status === "open" || ticket.status === "pending") && (
              <span
                className={cn(
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1",
                  sla === "breach" && "bg-red-50 text-red-700 ring-red-100",
                  sla === "warning" && "bg-amber-50 text-amber-700 ring-amber-100",
                  sla === "ok" && "bg-emerald-50 text-emerald-700 ring-emerald-100",
                )}
              >
                {slaLabel(sla)}
              </span>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Panel
            title="Conversation"
            description={`${publicMessages.length} customer-visible message${publicMessages.length === 1 ? "" : "s"}`}
          >
            <div className="space-y-3 p-5">
              {messages.length === 0 ? (
                <p className="text-sm text-neutral-400">No messages yet.</p>
              ) : (
                messages.map((m) => {
                  const isStaff = m.author_type === "staff";
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "rounded-xl border p-4",
                        m.is_internal
                          ? "border-amber-200 bg-amber-50/60"
                          : isStaff
                            ? "border-neutral-200 bg-neutral-900 text-white ml-4 sm:ml-8"
                            : "border-neutral-200 bg-white mr-4 sm:mr-8",
                      )}
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isStaff && !m.is_internal ? "text-white" : "text-neutral-900",
                          )}
                        >
                          {m.author_name ?? (isStaff ? "Support" : "Customer")}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            m.is_internal
                              ? "bg-amber-200 text-amber-900"
                              : isStaff
                                ? "bg-white/15 text-white/90"
                                : "bg-neutral-100 text-neutral-600",
                          )}
                        >
                          {m.is_internal ? "Internal" : isStaff ? "Agent" : "Customer"}
                        </span>
                        <span
                          className={cn(
                            "ml-auto text-[11px]",
                            isStaff && !m.is_internal ? "text-white/60" : "text-neutral-400",
                          )}
                        >
                          {new Date(m.created_at).toLocaleString("en-ZA", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "whitespace-pre-wrap text-sm leading-relaxed",
                          isStaff && !m.is_internal ? "text-white/90" : "text-neutral-700",
                        )}
                      >
                        {m.body}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>

          {canManage ? (
            <TicketReply ticketId={ticket.id} ticketStatus={ticket.status} />
          ) : (
            <Panel title="Read-only access">
              <p className="p-5 text-sm text-neutral-500">
                You can view this ticket but need support manage permission to reply or update it.
              </p>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Customer">
            <div className="p-5">
              <p className="font-semibold text-neutral-900">{ticket.customer_name}</p>
              <p className="mt-0.5 text-sm text-neutral-500">{ticket.customer_email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:${ticket.customer_email}?subject=Re: ${ticket.ticket_number} — ${ticket.subject}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email customer
                </a>
                <Link
                  href={customerRecord ? `/admin/customers/${customerRecord.id}` : `/admin/customers?q=${encodeURIComponent(ticket.customer_email ?? "")}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View customer
                </Link>
              </div>
            </div>
          </Panel>

          {ticket.order_id ? (
            <Panel title="Linked order">
              <div className="flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                  <Package className="h-5 w-5 text-neutral-600" />
                </span>
                <div>
                  <p className="font-mono text-sm font-semibold">{ticket.order_id}</p>
                  <Link
                    href={`/admin/orders/${ticket.order_id}`}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    Open order
                  </Link>
                </div>
              </div>
            </Panel>
          ) : null}

          <Panel title="Ticket operations">
            <TicketActionsPanel ticket={ticket} agents={team} canManage={canManage} />
          </Panel>

          <Panel title="Timeline">
            <dl className="divide-y divide-neutral-100 text-sm">
              <Row label="Created" value={formatTicketAge(ticket.created_at)} />
              <Row label="Last activity" value={formatTicketAge(ticket.updated_at)} />
              <Row label="Assigned to" value={assignee ?? "Unassigned"} />
              <Row
                label="Resolved"
                value={
                  ticket.resolved_at
                    ? new Date(ticket.resolved_at).toLocaleDateString("en-ZA")
                    : "—"
                }
              />
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <dt className="text-neutral-400">{label}</dt>
      <dd className="font-medium text-neutral-800">{value}</dd>
    </div>
  );
}
