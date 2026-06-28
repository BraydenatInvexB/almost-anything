import Link from "next/link";
import { getCurrentStaff, listTickets, listStaff } from "@/services/admin-service";
import { can } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusBadge,
  Table,
  Th,
  Td,
  EmptyState,
} from "@/components/admin/ui";
import { cn } from "@/lib/utils/cn";

const FILTERS = ["all", "open", "pending", "resolved", "closed"];

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !can(staff.role, "support.view")) return <AccessDenied feature="support" />;

  const { status = "all" } = await searchParams;
  const [tickets, team] = await Promise.all([listTickets(), listStaff()]);
  const filtered = status === "all" ? tickets : tickets.filter((t) => t.status === status);

  const open = tickets.filter((t) => t.status === "open").length;
  const urgent = tickets.filter((t) => t.priority === "urgent").length;
  const unassigned = tickets.filter((t) => !t.assigned_to).length;

  const agentName = (id: string | null) =>
    id ? (team.find((s) => s.id === id)?.full_name ?? "—") : "Unassigned";

  return (
    <>
      <PageHeader
        title="Support Helpdesk"
        subtitle="Respond to customers, manage tickets, and keep service times fast."
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total tickets" value={String(tickets.length)} />
        <StatCard label="Open" value={String(open)} />
        <StatCard label="Urgent" value={String(urgent)} />
        <StatCard label="Unassigned" value={String(unassigned)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/support" : `/admin/support?status=${f}`}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors",
              status === f
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
            )}
          >
            {f}
          </Link>
        ))}
      </div>

      <Panel>
        {filtered.length === 0 ? (
          <EmptyState title="No tickets" description="No tickets match this filter." />
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-neutral-100">
                <Th>Ticket</Th>
                <Th>Customer</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                <Th>Assigned</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((t) => (
                <tr key={t.id} className="cursor-pointer hover:bg-neutral-50">
                  <Td>
                    <Link href={`/admin/support/${t.id}`} className="block">
                      <p className="font-semibold text-neutral-900">{t.subject}</p>
                      <p className="text-xs text-neutral-400">
                        {t.ticket_number} · {t.category}
                      </p>
                    </Link>
                  </Td>
                  <Td>
                    <p className="font-medium text-neutral-700">{t.customer_name}</p>
                    <p className="text-xs text-neutral-400">{t.customer_email}</p>
                  </Td>
                  <Td>
                    <StatusBadge status={t.priority} />
                  </Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td className="text-neutral-600">{agentName(t.assigned_to)}</Td>
                  <Td className="text-neutral-500">
                    {new Date(t.updated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
