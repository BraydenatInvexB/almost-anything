import { Suspense } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Headphones,
  Inbox,
  UserX,
} from "lucide-react";
import { getCurrentStaff, listTickets, listStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { SupportDeskFilters } from "@/components/admin/SupportDeskFilters";
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
import {
  computeDeskMetrics,
  formatTicketAge,
  getSlaLevelFromTicket,
  slaLabel,
  sortTicketsForQueue,
} from "@/lib/support/helpdesk";
import { cn } from "@/lib/utils/cn";

function SlaBadge({ level }: { level: ReturnType<typeof getSlaLevelFromTicket> }) {
  if (level === "ok") {
    return (
      <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
        {slaLabel(level)}
      </span>
    );
  }
  if (level === "warning") {
    return (
      <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
        {slaLabel(level)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-100">
      <AlertTriangle className="h-3 w-3" />
      {slaLabel(level)}
    </span>
  );
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "support.view")) return <AccessDenied feature="support" />;

  const { status = "all", category = "all", q = "" } = await searchParams;
  const [tickets, team] = await Promise.all([listTickets(), listStaff()]);
  const metrics = computeDeskMetrics(tickets);

  const query = q.trim().toLowerCase();
  let filtered = tickets;
  if (status !== "all") filtered = filtered.filter((t) => t.status === status);
  if (category !== "all") filtered = filtered.filter((t) => t.category === category);
  if (query) {
    filtered = filtered.filter(
      (t) =>
        t.subject.toLowerCase().includes(query) ||
        (t.customer_name?.toLowerCase().includes(query) ?? false) ||
        (t.customer_email?.toLowerCase().includes(query) ?? false) ||
        t.ticket_number.toLowerCase().includes(query) ||
        (t.order_id?.toLowerCase().includes(query) ?? false),
    );
  }
  filtered = [...filtered].sort(sortTicketsForQueue);

  const agentName = (id: string | null) =>
    id ? (team.find((s) => s.id === id)?.full_name ?? "Unknown") : "Unassigned";

  return (
    <>
      <PageHeader
        title="Support Helpdesk"
        subtitle="Manage customer tickets, SLAs, assignments, and team responses in one queue."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Support" },
        ]}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard
          label="Open queue"
          value={String(metrics.open)}
          icon={<Inbox className="h-4 w-4" />}
          accent="bg-brand"
          hint="Needs attention"
        />
        <StatCard
          label="Urgent / high"
          value={String(metrics.urgent)}
          icon={<AlertTriangle className="h-4 w-4" />}
          accent="bg-red-500"
        />
        <StatCard
          label="Unassigned"
          value={String(metrics.unassigned)}
          icon={<UserX className="h-4 w-4" />}
          accent="bg-amber-500"
        />
        <StatCard
          label="SLA at risk"
          value={String(metrics.warning + metrics.breach)}
          icon={<Clock className="h-4 w-4" />}
          accent="bg-neutral-800"
          hint={`${metrics.breach} breached`}
        />
        <StatCard
          label="Resolved today"
          value={String(metrics.resolvedToday)}
          icon={<Headphones className="h-4 w-4" />}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Avg. first reply"
          value={`${metrics.avgResponseHrs}h`}
          icon={<Clock className="h-4 w-4" />}
          accent="bg-violet-500"
        />
      </div>

      <Suspense fallback={null}>
        <SupportDeskFilters
          currentStatus={status}
          currentCategory={category}
          currentQuery={q}
        />
      </Suspense>

      <Panel
        title="Ticket queue"
        description={`${filtered.length} ticket${filtered.length === 1 ? "" : "s"} · sorted by priority and wait time`}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No tickets match"
            description="Try a different filter or search term."
          />
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-neutral-100">
                <Th>Ticket</Th>
                <Th>Customer</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                <Th>SLA</Th>
                <Th>Assigned</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((t) => {
                const sla = getSlaLevelFromTicket(t);
                return (
                  <tr key={t.id} className="group hover:bg-neutral-50/80">
                    <Td>
                      <Link href={`/admin/support/${t.id}`} className="block min-w-[200px]">
                        <p className="font-semibold text-neutral-900 group-hover:text-brand">
                          {t.subject}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {t.ticket_number} · {t.category}
                          {t.order_id ? ` · ${t.order_id}` : ""}
                        </p>
                      </Link>
                    </Td>
                    <Td>
                      <p className="font-medium text-neutral-800">{t.customer_name}</p>
                      <p className="text-xs text-neutral-400">{t.customer_email}</p>
                    </Td>
                    <Td>
                      <StatusBadge status={t.priority} />
                    </Td>
                    <Td>
                      <StatusBadge status={t.status} />
                    </Td>
                    <Td>
                      {(t.status === "open" || t.status === "pending") ? (
                        <SlaBadge level={sla} />
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </Td>
                    <Td className={cn(!t.assigned_to && "font-medium text-amber-700")}>
                      {agentName(t.assigned_to)}
                    </Td>
                    <Td className="text-neutral-500">{formatTicketAge(t.updated_at)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Panel>
    </>
  );
}
