import { getCurrentSeller, getSellerDashboardStats } from "@/services/seller-service";
import { getSellerPlatformContext } from "@/services/seller/platform-context";
import { SellerDashboardView } from "@/components/seller/SellerDashboardView";

export default async function SellerDashboardPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;
  const [stats, platform] = await Promise.all([
    getSellerDashboardStats(seller),
    getSellerPlatformContext(),
  ]);
  return <SellerDashboardView seller={seller} stats={stats} platform={platform} />;
}
