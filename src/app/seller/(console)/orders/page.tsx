import { SellerEmptyState, SellerPanel, SellerPanelBody, SellerPanelHeader } from "@/components/seller/SellerPanel";
import { getCurrentSeller } from "@/services/seller-service";

export default async function SellerOrdersPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  return (
    <SellerPanel>
      <SellerPanelHeader
        title="Orders to fulfill"
        description="When customers purchase your products, orders appear here. Mark items as shipped and add courier tracking numbers."
      />
      <SellerPanelBody>
        <SellerEmptyState
          title="No pending orders"
          description="Share your business profile to start selling. Orders will show up here with fulfillment actions."
        />
      </SellerPanelBody>
    </SellerPanel>
  );
}
