import { getCurrentStaff, getDashboardStats, getFulfillmentQueue } from "@/services/admin-service";
import { countOpenItemRequests } from "@/services/sourcing-request-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { DashboardView } from "@/components/admin/DashboardView";

export default async function AdminDashboardPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "dashboard.view")) return <AccessDenied feature="the dashboard" />;

  const stats = await getDashboardStats();
  const fulfillment = await getFulfillmentQueue();
  const openItemRequests = staffCan(staff, "procurement.view") ? await countOpenItemRequests() : 0;

  return (
    <DashboardView
      staff={staff}
      stats={stats}
      fulfillmentCount={fulfillment.length}
      openItemRequests={openItemRequests}
      showItemRequests={staffCan(staff, "procurement.view")}
    />
  );
}
