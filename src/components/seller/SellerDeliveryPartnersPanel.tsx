import { Truck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { describePlatformShipping } from "@/lib/shipping/platform-shipping";
import type { SellerPlatformCourier } from "@/services/seller/platform-context";
import type { SellerShippingContext } from "@/lib/seller/product-pricing";

export function SellerDeliveryPartnersPanel({
  couriers,
  shipping,
  preferredCourierIds = [],
  title = "Delivery partners",
  description = "Active couriers configured by the platform for customer orders.",
}: {
  couriers: SellerPlatformCourier[];
  shipping: SellerShippingContext;
  preferredCourierIds?: string[];
  title?: string;
  description?: string;
}) {
  return (
    <Card variant="elevated" className="p-6">
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-neutral-600">{description}</p>
          <p className="mt-2 text-xs text-neutral-500">{describePlatformShipping(shipping)}</p>
        </div>
      </div>

      {couriers.length ? (
        <ul className="mt-4 space-y-2">
          {couriers.map((courier) => {
            const preferred = preferredCourierIds.includes(courier.id);
            return (
              <li
                key={courier.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {courier.name}
                    {preferred ? (
                      <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-brand">
                        Preferred
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {courier.etaLabel} · {courier.regions.join(", ")}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">No delivery partners are enabled yet.</p>
      )}
    </Card>
  );
}
