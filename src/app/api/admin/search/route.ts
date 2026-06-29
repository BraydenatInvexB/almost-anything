import { NextResponse } from "next/server";
import { getCurrentStaff, listAdminOrders, listCustomers } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { listCheckoutOrders } from "@/lib/admin/operations-store";
import { orderNumbersMatch } from "@/lib/orders/order-number";

export async function GET(request: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") ?? "all";
  const limit = Math.min(Number(searchParams.get("limit") ?? 12), 30);

  if (q.length < 1) {
    return NextResponse.json({ orders: [], customers: [] });
  }

  const needle = q.toLowerCase();

  const orders = await listAdminOrders();
  const checkout = listCheckoutOrders().map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    status: o.status,
    total: o.total,
    currency: o.currency,
    createdAt: o.createdAt,
  }));

  const mergedOrders = [
    ...checkout,
    ...orders.filter((o) => !checkout.some((c) => c.id === o.id || c.orderNumber === o.orderNumber)),
  ];

  const orderHits =
    type === "customers"
      ? []
      : mergedOrders
          .filter(
            (o) =>
              o.orderNumber.toLowerCase().includes(needle) ||
              orderNumbersMatch(o.orderNumber, q) ||
              o.customerName.toLowerCase().includes(needle) ||
              o.customerEmail.toLowerCase().includes(needle),
          )
          .slice(0, limit);

  let customerHits: Awaited<ReturnType<typeof listCustomers>> = [];
  if (type !== "orders" && staffCan(staff, "customers.view")) {
    const customers = await listCustomers();
    customerHits = customers
      .filter(
        (c) =>
          c.full_name.toLowerCase().includes(needle) ||
          c.email.toLowerCase().includes(needle) ||
          (c.phone?.includes(q) ?? false),
      )
      .slice(0, limit);
  }

  return NextResponse.json({ orders: orderHits, customers: customerHits });
}
