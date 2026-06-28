import Link from "next/link";
import Image from "next/image";
import { getCurrentStaff, listCustomers } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
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
import { CustomerActions } from "@/components/admin/CustomerActions";
import { formatCurrency } from "@/lib/utils/cn";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "customers.view")) return <AccessDenied feature="customers" />;

  const { q = "" } = await searchParams;
  let customers = await listCustomers();
  if (q.trim()) {
    const query = q.trim().toLowerCase();
    customers = customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query),
    );
  }

  const canReset = staffCan(staff, "customers.reset_password");

  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const vips = customers.filter((c) => c.status === "vip").length;
  const avgSpend = customers.length ? totalRevenue / customers.length : 0;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={
          q
            ? `Showing results for "${q}"`
            : "View customer accounts, order history, and help them when they need it."
        }
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Customers" },
        ]}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total customers" value={String(customers.length)} />
        <StatCard label="VIP customers" value={String(vips)} />
        <StatCard label="Lifetime revenue" value={formatCurrency(totalRevenue, "ZAR")} />
        <StatCard label="Avg. spend" value={formatCurrency(avgSpend, "ZAR")} />
      </div>

      <Panel>
        {customers.length === 0 ? (
          <EmptyState
            title={q ? "No customers match your search" : "No customers yet"}
            description={q ? "Try a different name or email." : "Customers appear here when they sign up or place orders."}
          />
        ) : (
        <Table>
          <thead>
            <tr className="border-b border-neutral-100">
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th>Orders</Th>
              <Th>Lifetime value</Th>
              <Th>Joined</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
                <Td className="min-w-[220px] whitespace-normal">
                  <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3 py-0.5">
                    {c.avatar_url ? (
                      <Image
                        src={c.avatar_url}
                        alt={c.full_name}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                        {c.full_name.charAt(0)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium leading-snug text-neutral-900">{c.full_name}</p>
                      <p className="mt-0.5 truncate text-xs leading-snug text-neutral-500">{c.email}</p>
                    </div>
                  </Link>
                </Td>
                <Td className="whitespace-nowrap">
                  <StatusBadge status={c.status} />
                </Td>
                <Td className="whitespace-nowrap text-neutral-600">{c.orders_count}</Td>
                <Td className="whitespace-nowrap font-semibold">{formatCurrency(c.total_spent, "ZAR")}</Td>
                <Td className="whitespace-nowrap text-neutral-500">
                  {new Date(c.created_at).toLocaleDateString("en-ZA", {
                    month: "short",
                    year: "numeric",
                  })}
                </Td>
                <Td className="whitespace-nowrap">
                  <CustomerActions customerId={c.id} email={c.email} canReset={canReset} />
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
