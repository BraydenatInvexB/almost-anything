import { staffCan } from "@/config/rbac";
import type { AdminNotificationItem, AdminNotificationSummary } from "@/lib/admin/notifications";
import { notificationTotal } from "@/lib/admin/notifications";
import type { StaffProfile } from "@/types/staff-access";
import { countOpenItemRequests } from "@/services/sourcing-request-service";
import { countPendingSellerApplications } from "@/services/admin/sellers";
import { getFulfillmentQueue } from "./orders";
import { listAdminProducts } from "./products";
import { listTickets } from "./tickets";

export async function getAdminNotificationSummary(
  staff: StaffProfile,
): Promise<AdminNotificationSummary> {
  const items: AdminNotificationItem[] = [];

  if (staffCan(staff, "orders.view")) {
    const fulfillment = await getFulfillmentQueue();
    if (fulfillment.length > 0) {
      items.push({
        id: "fulfillment",
        title: "Fulfillment",
        description: `${fulfillment.length} order${fulfillment.length === 1 ? "" : "s"} to process or ship`,
        href: "/admin/fulfillment",
        count: fulfillment.length,
      });
    }
  }

  if (staffCan(staff, "procurement.view")) {
    const requests = await countOpenItemRequests();
    if (requests > 0) {
      items.push({
        id: "requests",
        title: "Item requests",
        description: `${requests} custom product lookup${requests === 1 ? "" : "s"}`,
        href: "/admin/requests",
        count: requests,
      });
    }
  }

  if (staffCan(staff, "support.view")) {
    const tickets = await listTickets();
    const open = tickets.filter((t) => t.status === "open" || t.status === "pending");
    if (open.length > 0) {
      items.push({
        id: "support",
        title: "Support",
        description: `${open.length} ticket${open.length === 1 ? "" : "s"} awaiting reply`,
        href: "/admin/support",
        count: open.length,
      });
    }
  }

  if (staffCan(staff, "products.view")) {
    const lowStock = (await listAdminProducts()).filter(
      (p) => p.stock_status === "low_stock" || p.stock_status === "out_of_stock",
    ).length;
    if (lowStock > 0) {
      items.push({
        id: "stock",
        title: "Stock alerts",
        description: `${lowStock} product${lowStock === 1 ? "" : "s"} low or out of stock`,
        href: "/admin/products",
        count: lowStock,
      });
    }
  }

  if (staffCan(staff, "sellers.view")) {
    const pendingSellers = await countPendingSellerApplications();
    if (pendingSellers > 0) {
      items.push({
        id: "sellers",
        title: "Seller applications",
        description: `${pendingSellers} seller${pendingSellers === 1 ? "" : "s"} awaiting review`,
        href: "/admin/sellers",
        count: pendingSellers,
      });
    }
  }

  items.sort((a, b) => b.count - a.count);

  return {
    total: notificationTotal(items),
    items,
  };
}
