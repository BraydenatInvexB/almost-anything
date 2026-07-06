"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { SellerProfile } from "@/types/seller";
import { SELLER_NAV, SELLER_NAV_GROUP_ORDER } from "@/config/seller-nav";
import { sellerCan } from "@/config/seller-rbac";
import { SellerShellHeader, SellerShellSidebar } from "@/components/seller/SellerShellParts";
import type { SellerNavGroup } from "@/components/seller/SellerNavList";
import type { SellerAccessState } from "@/lib/seller/seller-access";

const LOCKED_NAV_HREFS = new Set(["/seller/settings", "/seller/verification"]);

export function SellerShell({
  seller,
  access,
  children,
}: {
  seller: SellerProfile;
  access: SellerAccessState;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = SELLER_NAV.filter((item) => {
    if (!sellerCan(seller, item.permission)) return false;
    if (!access.canUseDashboard) return LOCKED_NAV_HREFS.has(item.href);
    return true;
  });

  const groups = useMemo(
    () =>
      SELLER_NAV_GROUP_ORDER.map((group) => ({
        group,
        items: visibleNav.filter((item) => item.group === group),
      })).filter((g) => g.items.length > 0) as SellerNavGroup[],
    [visibleNav],
  );

  const pageTitle = useMemo(() => {
    if (pathname.startsWith("/seller/verification")) return "Verification";
    const match = SELLER_NAV.find((item) =>
      item.href === "/seller" ? pathname === "/seller" : pathname.startsWith(item.href),
    );
    return match?.label ?? "Seller";
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-[#f4f6f9] text-neutral-900">
      <SellerShellSidebar
        seller={seller}
        groups={groups}
        pathname={pathname}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <SellerShellHeader pageTitle={pageTitle} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
