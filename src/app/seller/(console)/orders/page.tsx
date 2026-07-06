import { Card } from "@/components/ui/Card";
import { getCurrentSeller } from "@/services/seller-service";

export default async function SellerOrdersPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  return (
    <Card variant="elevated" className="p-6">
      <h2 className="text-lg font-semibold">Orders to fulfill</h2>
      <p className="mt-2 text-sm text-neutral-600">
        When customers purchase your products, orders appear here. Mark items as shipped and add courier tracking numbers.
      </p>
      <div className="mt-6 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
        No pending orders yet. Share your business profile to start selling.
      </div>
    </Card>
  );
}
