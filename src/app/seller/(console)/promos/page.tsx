import { SellerPromoDesk } from "@/components/seller/SellerPromoDesk";

export default function SellerPromosPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-600">
        Create promo codes scoped to your products. Codes apply at checkout for your listings only.
      </p>
      <SellerPromoDesk />
    </div>
  );
}
