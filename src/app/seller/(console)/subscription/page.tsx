import { getCurrentSeller } from "@/services/seller-service";
import { SELLER_PLANS, formatPlanPrice } from "@/config/seller-plans";
import { Card } from "@/components/ui/Card";

export default async function SellerSubscriptionPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="border-brand/20 bg-brand/5 p-6">
        <h2 className="text-lg font-semibold">Billing starts on your first sale</h2>
        <p className="mt-2 text-sm text-neutral-700">
          You&apos;re on the {formatPlanPrice(seller.plan)} plan ({seller.subscriptionStatus}).
          {seller.firstSaleAt
            ? ` Subscription started ${new Date(seller.firstSaleAt).toLocaleDateString()}.`
            : " No charges until your first customer order."}
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {SELLER_PLANS.map((plan) => (
          <Card
            key={plan.id}
            variant="elevated"
            className={`p-6 ${seller.plan === plan.id ? "ring-2 ring-brand" : ""}`}
          >
            <p className="text-sm font-bold uppercase tracking-wide text-brand">{plan.name}</p>
            <p className="mt-2 text-3xl font-bold">R{plan.priceMonthly}<span className="text-base font-normal text-neutral-500">/mo</span></p>
            <p className="mt-3 text-sm text-neutral-600">{plan.description}</p>
            <p className="mt-4 text-sm font-semibold">
              {plan.itemLimit === null ? "Unlimited items" : `Up to ${plan.itemLimit} items`}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
