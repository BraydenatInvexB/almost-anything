import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCurrentStaff, getSellerAdminDetail } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { SellerDetailPanel } from "@/components/admin/SellerDetailPanel";

export default async function AdminSellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.view")) {
    return <AccessDenied feature="seller details" />;
  }

  const { id } = await params;
  const detail = await getSellerAdminDetail(id);
  if (!detail) notFound();

  return (
    <Suspense fallback={<div className="text-sm text-neutral-500">Loading seller…</div>}>
      <SellerDetailPanel
        seller={detail.seller}
        documents={detail.documents}
        payouts={detail.payouts}
        canManage={staffCan(staff, "sellers.manage")}
      />
    </Suspense>
  );
}
