import Link from "next/link";
import { Store, Package, ShoppingCart, AlertTriangle, CreditCard } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/cn";
import type { SellerDashboardStats, SellerProfile } from "@/types/seller";

export function SellerDashboardView({
  seller,
  stats,
}: {
  seller: SellerProfile;
  stats: SellerDashboardStats;
}) {
  const limitLabel =
    stats.productLimit === null ? "Unlimited listings" : `${stats.productCount} / ${stats.productLimit} listings`;

  return (
    <div className="space-y-6">
      {seller.status !== "approved" ? (
        <Card variant="elevated" className="border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Application under review</p>
              <p className="mt-1 text-sm text-amber-800">
                Your shop is {seller.status.replace("_", " ")}. You can prepare products while we verify your documents.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {seller.subscriptionStatus === "trial" ? (
        <Card variant="elevated" className="border-brand/20 bg-brand/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-neutral-900">Trial period — billing starts on your first sale</p>
              <p className="mt-1 text-sm text-neutral-600">
                {stats.planLabel} plan · no subscription charge until you make your first sale.
              </p>
            </div>
            <Link href="/seller/subscription">
              <Button variant="secondary" size="sm">
                <CreditCard className="h-4 w-4" />
                View plan
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card variant="elevated" className="p-5">
          <Package className="h-5 w-5 text-brand" />
          <p className="mt-3 text-2xl font-bold">{stats.productCount}</p>
          <p className="text-sm text-neutral-500">{limitLabel}</p>
        </Card>
        <Card variant="elevated" className="p-5">
          <ShoppingCart className="h-5 w-5 text-brand" />
          <p className="mt-3 text-2xl font-bold">{stats.orderCount}</p>
          <p className="text-sm text-neutral-500">{stats.pendingOrders} awaiting shipment</p>
        </Card>
        <Card variant="elevated" className="p-5">
          <Store className="h-5 w-5 text-brand" />
          <p className="mt-3 text-2xl font-bold">{formatCurrency(stats.revenueTotal, "ZAR")}</p>
          <p className="text-sm text-neutral-500">Gross sales</p>
        </Card>
        <Card variant="elevated" className="p-5">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <p className="mt-3 text-2xl font-bold">{stats.lowStockCount}</p>
          <p className="text-sm text-neutral-500">Low stock SKUs</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="elevated" className="p-6">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/seller/products"><Button size="sm">Add product</Button></Link>
            <Link href="/seller/inventory"><Button variant="secondary" size="sm">Import stock list</Button></Link>
            <Link href="/seller/orders"><Button variant="secondary" size="sm">View orders</Button></Link>
            <Link href="/seller/promos"><Button variant="secondary" size="sm">Create promo</Button></Link>
          </div>
        </Card>
        <Card variant="elevated" className="p-6">
          <h2 className="text-lg font-semibold">Your storefront</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Customers can find your business in our directory once approved.
          </p>
          <Link href={`/businesses/${seller.slug}`} className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
            Preview business profile →
          </Link>
        </Card>
      </div>
    </div>
  );
}
