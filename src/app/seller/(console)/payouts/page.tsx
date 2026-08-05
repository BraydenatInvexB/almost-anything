import { SellerPayoutDesk } from "@/components/seller/SellerPayoutDesk";
import { getCurrentSeller } from "@/services/seller-service";
import { getSellerPayoutSummary } from "@/services/seller/payouts";

export default async function SellerPayoutsPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;
  const summary = await getSellerPayoutSummary(seller.id, Boolean(seller.vatNumber));
  return <SellerPayoutDesk summary={summary} />;
}
