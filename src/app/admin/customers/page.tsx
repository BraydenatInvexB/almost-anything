import Link from "next/link";
import Image from "next/image";
import { getCurrentStaff, listCustomers } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import {
  PageHeader,
  StatCard,
  Panel,
  StatusBadge,
  Table,
  Th,
  Td,
} from "@/components/admin/ui";
import { CustomerActions } from "@/components/admin/CustomerActions";
import { formatCurrency } from "@/lib/utils/cn";

export default async function AdminCustomersPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "customers.view")) return <AccessDenied feature="customers" />;

  const customers = await listCustomers();
  const canReset = staffCan(staff, "customers.reset_password");

  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const vips = customers.filter((c) => c.status === "vip").length;
  const avgSpend = customers.length ? totalRevenue / customers.length : 0;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="View customer accounts, order history, and help them when they need it."
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total customers" value={String(customers.length)} />
        <StatCard label="VIP customers" value={String(vips)} />
        <StatCard label="Lifetime revenue" value={formatCurrency(totalRevenue, "USD")} />
        <StatCard label="Avg. spend" value={formatCurrency(avgSpend, "USD")} />
      </div>

      <Panel>
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
          <tbody className="divide-y divide-neutral-50">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-50/80">
                <Td>
                  <Link href={`/admin/customers/${c.id}`} className="flex items-center gap-3">
                    {c.avatar_url ? (
                      <Image
                        src={c.avatar_url}
                        alt={c.full_name}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                        {c.full_name.charAt(0)}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-neutral-900">{c.full_name}</p>
                      <p className="text-xs text-neutral-400">{c.email}</p>
                    </div>
                  </Link>
                </Td>
                <Td>
                  <StatusBadge status={c.status} />
                </Td>
                <Td className="text-neutral-600">{c.orders_count}</Td>
                <Td className="font-semibold">{formatCurrency(c.total_spent, "USD")}</Td>
                <Td className="text-neutral-500">
                  {new Date(c.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </Td>
                <Td>
                  <CustomerActions customerId={c.id} email={c.email} canReset={canReset} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}
