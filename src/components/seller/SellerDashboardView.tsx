import Link from "next/link";
import { Store, Package, ShoppingCart, AlertTriangle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/cn";
import { SellerPlatformMessagesPanel } from "@/components/seller/SellerPlatformMessagesPanel";
import { PaymentGatewayFeesNotice } from "@/components/seller/PaymentGatewayFeesNotice";
import { SellerDeliveryPartnersPanel } from "@/components/seller/SellerDeliveryPartnersPanel";
import { SellerPanel, SellerPanelBody, SellerPanelHeader, SellerStat, SellerStatGrid } from "@/components/seller/SellerPanel";
import type { SellerDashboardStats, SellerProfile } from "@/types/seller";
import type { SellerPlatformContext } from "@/services/seller/platform-context";

export function SellerDashboardView({
  seller,
  stats,
  platform,
}: {
  seller: SellerProfile;
  stats: SellerDashboardStats;
  platform: SellerPlatformContext;
}) {
  const limitLabel =
    stats.productLimit === null ? "Unlimited listings" : `${stats.productCount} / ${stats.productLimit} listings`;

  return (
    <div className="space-y-6">
      <SellerPlatformMessagesPanel />

      {seller.status !== "approved" ? (
        <SellerPanel className="border-amber-200 bg-amber-50/50">
          <SellerPanelBody className="flex items-start gap-3 py-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900">Application under review</p>
              <p className="mt-1 text-sm text-amber-800">
                Your shop is {seller.status.replace("_", " ")}. You can prepare products while we verify your documents.
              </p>
            </div>
          </SellerPanelBody>
        </SellerPanel>
      ) : null}

      {seller.subscriptionStatus === "trial" ? (
        <SellerPanel className="border-brand/20 bg-brand/[0.03]">
          <SellerPanelBody className="flex flex-wrap items-center justify-between gap-4 py-5">
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
          </SellerPanelBody>
        </SellerPanel>
      ) : null}

      <SellerStatGrid>
        <SellerStat label="Listings" value={stats.productCount} hint={limitLabel} />
        <SellerStat label="Orders" value={stats.orderCount} hint={`${stats.pendingOrders} awaiting shipment`} />
        <SellerStat label="Gross sales" value={formatCurrency(stats.revenueTotal, "ZAR")} hint="Lifetime revenue" />
        <SellerStat
          label="Low stock"
          value={stats.lowStockCount}
          hint="SKUs at five units or fewer"
          tone={stats.lowStockCount ? "warning" : "neutral"}
        />
      </SellerStatGrid>

      <div className="grid gap-4 lg:grid-cols-2">
        <SellerPanel>
          <SellerPanelHeader title="Quick actions" description="Common tasks for managing your shop" />
          <SellerPanelBody className="flex flex-wrap gap-2 pt-4">
            <Link href="/seller/products?tab=add"><Button size="sm"><Package className="h-4 w-4" />Add product</Button></Link>
            <Link href="/seller/products?tab=import"><Button variant="secondary" size="sm">Import stock list</Button></Link>
            <Link href="/seller/orders"><Button variant="secondary" size="sm"><ShoppingCart className="h-4 w-4" />Orders</Button></Link>
            <Link href="/seller/promos"><Button variant="secondary" size="sm">Promos</Button></Link>
          </SellerPanelBody>
        </SellerPanel>
        <SellerPanel>
          <SellerPanelHeader title="Your storefront" description="How customers discover your business" />
          <SellerPanelBody className="pt-4">
            <div className="flex items-start gap-3 rounded-lg bg-neutral-50 p-4">
              <Store className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div>
                <p className="text-sm text-neutral-600">
                  Customers can find your business in our directory once approved.
                </p>
                <Link href={`/businesses/${seller.slug}`} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
                  Preview business profile →
                </Link>
              </div>
            </div>
          </SellerPanelBody>
        </SellerPanel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SellerDeliveryPartnersPanel
          couriers={platform.couriers}
          shipping={platform.shipping}
          preferredCourierIds={seller.preferredCouriers}
          title="Delivery partners"
          description="Couriers enabled on the platform for your customer orders."
        />
        <PaymentGatewayFeesNotice compact />
      </div>
    </div>
  );
}
