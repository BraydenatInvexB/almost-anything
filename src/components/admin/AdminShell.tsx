"use client";

export { AdminSearch } from "@/components/admin/AdminSearch";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import type { StaffProfile } from "@/types/staff-access";
import { ADMIN_NAV, staffCan } from "@/config/rbac";
import type { AdminNotificationSummary } from "@/lib/admin/notifications";
import {
  ADMIN_NAV_GROUP_ORDER,
  type AdminNavGroup,
} from "@/components/admin/AdminNavList";
import { AdminShellSidebar } from "@/components/admin/AdminShellSidebar";
import { AdminShellHeader } from "@/components/admin/AdminShellHeader";

export function AdminShell({
  staff,
  children,
  notifications,
}: {
  staff: StaffProfile;
  children: React.ReactNode;
  notifications: AdminNotificationSummary;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = ADMIN_NAV.filter((item) => staffCan(staff, item.permission));

  const groups = useMemo(
    () =>
      ADMIN_NAV_GROUP_ORDER.map((g) => ({
        group: g,
        items: visibleNav.filter((i) => i.group === g),
      })).filter((g) => g.items.length > 0) as AdminNavGroup[],
    [visibleNav],
  );

  const showNotifications =
    staffCan(staff, "orders.view") ||
    staffCan(staff, "procurement.view") ||
    staffCan(staff, "support.view") ||
    staffCan(staff, "products.view") ||
    staffCan(staff, "sellers.view");

  const pageTitle = useMemo(() => {
    const match = ADMIN_NAV.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href),
    );
    if (pathname.includes("/orders/")) return "Order detail";
    if (pathname.includes("/customers/")) return "Customer profile";
    if (pathname.includes("/support/")) return "Support ticket";
    if (pathname.includes("/returns/")) return "Return detail";
    if (pathname.includes("/sellers/")) return "Seller review";
    if (pathname.startsWith("/admin/sellers")) return "Marketplace sellers";
    if (pathname.includes("/requests")) return "Item requests";
    return match?.label ?? "Admin";
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-[#f4f6f9] text-neutral-900">
      <AdminShellSidebar
        groups={groups}
        pathname={pathname}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminShellHeader
          staff={staff}
          pageTitle={pageTitle}
          showNotifications={showNotifications}
          notifications={notifications}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
