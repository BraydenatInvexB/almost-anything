"use client";

import { Card } from "@/components/ui/Card";
import { formatPlanPrice } from "@/config/seller-plans";
import { getSellerEntityLabel } from "@/config/seller-entity-types";
import type { SellerProfile } from "@/types/seller";

export function SellerAdminOverviewTab({
  seller,
  status,
}: {
  seller: SellerProfile;
  status: SellerProfile["status"];
}) {
  return (
    <Card variant="elevated" className="p-6">
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-neutral-500">Status</dt><dd className="font-medium capitalize">{status.replace("_", " ")}</dd></div>
        <div><dt className="text-neutral-500">Plan</dt><dd>{formatPlanPrice(seller.plan)}</dd></div>
        <div><dt className="text-neutral-500">Subscription</dt><dd className="capitalize">{seller.subscriptionStatus}</dd></div>
        <div><dt className="text-neutral-500">Contact</dt><dd>{seller.contactEmail} · {seller.contactPhone}</dd></div>
        <div><dt className="text-neutral-500">Entity type</dt><dd>{getSellerEntityLabel(seller.entityType)}</dd></div>
        <div><dt className="text-neutral-500">Registration</dt><dd>{seller.registrationNumber ?? "—"}</dd></div>
        <div><dt className="text-neutral-500">VAT</dt><dd>{seller.vatNumber ?? "—"}</dd></div>
        <div><dt className="text-neutral-500">Storefront</dt><dd>/businesses/{seller.slug}</dd></div>
        <div className="sm:col-span-2">
          <dt className="text-neutral-500">Categories</dt>
          <dd>{seller.sellsAllCategories ? "All categories" : seller.categorySlugs.join(", ") || "—"}</dd>
        </div>
      </dl>
    </Card>
  );
}
