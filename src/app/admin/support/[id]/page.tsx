import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { getCurrentStaff, getTicket, listStaff } from "@/services/admin-service";
import { can } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { Panel, StatusBadge } from "@/components/admin/ui";
import { TicketReply } from "@/components/admin/TicketReply";
import { cn } from "@/lib/utils/cn";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !can(staff.role, "support.view")) return <AccessDenied feature="support" />;

  const { id } = await params;
  const result = await getTicket(id);
  if (!result) notFound();

  const { ticket, messages } = result;
  const team = await listStaff();
  const assignee = ticket.assigned_to
    ? team.find((s) => s.id === ticket.assigned_to)?.full_name
    : null;
  const canReply = can(staff.role, "support.manage");

  return (
    <>
      <Link
        href="/admin/support"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to helpdesk
      </Link>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Conversation */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900">{ticket.subject}</h1>
            <StatusBadge status={ticket.status} />
            <StatusBadge status={ticket.priority} />
          </div>

          <div className="mb-4 flex flex-col gap-3">
            {messages.length === 0 && (
              <p className="text-sm text-neutral-400">No messages yet.</p>
            )}
            {messages.map((m) => {
              const isStaff = m.author_type === "staff";
              return (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-2xl border p-4",
                    m.is_internal
                      ? "border-amber-200 bg-amber-50"
                      : isStaff
                        ? "border-neutral-200 bg-neutral-900 text-white"
                        : "border-neutral-200 bg-white",
                  )}
                >
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", isStaff && !m.is_internal ? "text-white" : "text-neutral-900")}>
                      {m.author_name ?? (isStaff ? "Support" : "Customer")}
                    </span>
                    {m.is_internal && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        <Lock className="h-2.5 w-2.5" /> Internal
                      </span>
                    )}
                    <span
                      className={cn(
                        "ml-auto text-[11px]",
                        isStaff && !m.is_internal ? "text-white/60" : "text-neutral-400",
                      )}
                    >
                      {new Date(m.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm leading-relaxed",
                      isStaff && !m.is_internal ? "text-white/90" : "text-neutral-700",
                    )}
                  >
                    {m.body}
                  </p>
                </div>
              );
            })}
          </div>

          {canReply && <TicketReply ticketId={ticket.id} />}
        </div>

        {/* Sidebar details */}
        <div className="flex flex-col gap-4">
          <Panel title="Customer">
            <div className="p-5">
              <p className="font-semibold text-neutral-900">{ticket.customer_name}</p>
              <p className="text-sm text-neutral-500">{ticket.customer_email}</p>
              <a
                href={`mailto:${ticket.customer_email}`}
                className="mt-3 inline-block rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Email customer
              </a>
            </div>
          </Panel>

          <Panel title="Details">
            <dl className="flex flex-col divide-y divide-neutral-100 text-sm">
              <Row label="Ticket" value={ticket.ticket_number} />
              <Row label="Category" value={ticket.category} />
              <Row label="Priority" value={<StatusBadge status={ticket.priority} />} />
              <Row label="Status" value={<StatusBadge status={ticket.status} />} />
              <Row label="Assigned to" value={assignee ?? "Unassigned"} />
              <Row
                label="Created"
                value={new Date(ticket.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
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
      <dd className="font-medium capitalize text-neutral-800">{value}</dd>
    </div>
  );
}
