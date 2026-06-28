import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCurrentStaff,
  getCustomer,
  getCustomerOrders,
  listTickets,
} from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { CustomerActions } from "@/components/admin/CustomerActions";
import {
  PageHeader,
  Panel,
  StatCard,
  StatusBadge,
  Table,
  Th,
  Td,
  BtnSecondary,
  DetailGrid,
  DetailItem,
} from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "customers.view")) {
    return <AccessDenied feature="customers" />;
  }

  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const orders = await getCustomerOrders(customer.email);
  const tickets = (await listTickets()).filter(
    (t) => t.customer_email?.toLowerCase() === customer.email.toLowerCase(),
  );
  const canReset = staffCan(staff, "customers.reset_password");

  return (
    <>
      <PageHeader
        title={customer.full_name}
        subtitle={customer.email}
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Customers", href: "/admin/customers" },
          { label: customer.full_name },
        ]}
        action={
          <CustomerActions customerId={customer.id} email={customer.email} canReset={canReset} />
        }
      />

      <div className="mb-4 flex items-center gap-4">
        {customer.avatar_url ? (
          <Image
            src={customer.avatar_url}
            alt={customer.full_name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-xl object-cover ring-2 ring-neutral-100"
          />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-neutral-950 text-xl font-bold text-white">
            {customer.full_name.charAt(0)}
          </span>
        )}
        <div>
          <StatusBadge status={customer.status} />
          <p className="mt-1 text-sm text-neutral-500">
            Customer since{" "}
            {new Date(customer.created_at).toLocaleDateString("en-ZA", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Orders" value={String(orders.length || customer.orders_count)} accent="bg-brand" />
        <StatCard
          label="Lifetime value"
          value={formatCurrency(
            orders.reduce((s, o) => s + o.total, 0) || customer.total_spent,
            "ZAR",
          )}
          accent="bg-neutral-950"
        />
        <StatCard label="Support tickets" value={String(tickets.length)} accent="bg-amber-500" />
        <StatCard
          label="Last order"
          value={
            customer.last_order_at
              ? new Date(customer.last_order_at).toLocaleDateString("en-ZA", {
                  month: "short",
                  day: "numeric",
                })
              : orders[0]
                ? new Date(orders[0].createdAt).toLocaleDateString("en-ZA", {
                    month: "short",
                    day: "numeric",
                  })
                : "—"
          }
          accent="bg-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Profile" className="lg:col-span-1">
          <div className="p-5">
            <DetailGrid>
              <DetailItem label="Email">{customer.email}</DetailItem>
              <DetailItem label="Phone">{customer.phone ?? "—"}</DetailItem>
              <DetailItem label="Account status">
                <StatusBadge status={customer.status} />
              </DetailItem>
              <DetailItem label="Member ID">
                <span className="font-mono text-xs">{customer.id}</span>
              </DetailItem>
            </DetailGrid>
          </div>
        </Panel>

        <Panel title="Order history" className="lg:col-span-2">
          {orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-neutral-500">No orders yet.</p>
          ) : (
            <Table>
              <thead>
                <tr className="border-b border-neutral-100">
                  <Th>Order</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
                    <Td className="whitespace-nowrap font-semibold">{o.orderNumber}</Td>
                    <Td className="whitespace-nowrap text-neutral-500">
                      {new Date(o.createdAt).toLocaleDateString("en-ZA")}
                    </Td>
                    <Td>
                      <StatusBadge status={o.status} />
                    </Td>
                    <Td className="text-right font-semibold">
                      {formatCurrency(o.total, o.currency)}
                    </Td>
                    <Td className="text-right">
                      <BtnSecondary href={`/admin/orders/${o.id}`}>Open</BtnSecondary>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </div>

      {tickets.length > 0 && (
        <Panel title="Support history" className="mt-4">
          <Table>
            <thead>
              <tr className="border-b border-neutral-100">
                <Th>Ticket</Th>
                <Th>Subject</Th>
                <Th>Status</Th>
                <Th>Priority</Th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/80">
                  <Td className="whitespace-nowrap font-medium">
                    <Link href={`/admin/support/${t.id}`} className="text-brand hover:underline">
                      {t.ticket_number}
                    </Link>
                  </Td>
                  <Td className="max-w-xs whitespace-normal text-neutral-600">
                    <Link href={`/admin/support/${t.id}`} className="hover:text-brand">
                      {t.subject}
                    </Link>
                  </Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                  <Td>
                    <StatusBadge status={t.priority} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}
    </>
  );
}
