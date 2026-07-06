import { getCurrentSeller, getSellerDashboardStats } from "@/services/seller-service";
import { SellerDashboardView } from "@/components/seller/SellerDashboardView";

export default async function SellerDashboardPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;
  const stats = await getSellerDashboardStats(seller);
  return <SellerDashboardView seller={seller} stats={stats} />;
}
