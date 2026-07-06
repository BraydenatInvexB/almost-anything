import { getCurrentStaff, listAllSellers } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { SellersDesk } from "@/components/admin/SellersDesk";

export default async function AdminSellersPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "sellers.view")) {
    return <AccessDenied feature="seller management" />;
  }

  const sellers = await listAllSellers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Marketplace sellers</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review applications, company documents, subscription plans, and payout requests.
        </p>
      </div>
      <SellersDesk sellers={sellers} />
    </div>
  );
}
