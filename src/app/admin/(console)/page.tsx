import {
  getCurrentStaff,
  getDashboardStats,
  getFulfillmentQueue,
  countPendingSellerApplications,
} from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { DashboardView } from "@/components/admin/DashboardView";

export default async function AdminDashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "dashboard.view")) return <AccessDenied feature="the dashboard" />;

  const stats = await getDashboardStats();
  const fulfillment = await getFulfillmentQueue();
  const showSellers = staffCan(staff, "sellers.view");
  const pendingSellerApplications = showSellers ? await countPendingSellerApplications() : 0;

  return (
    <DashboardView
      staff={staff}
      stats={stats}
      fulfillmentCount={fulfillment.length}
      pendingSellerApplications={pendingSellerApplications}
      showSellers={showSellers}
    />
  );
}
