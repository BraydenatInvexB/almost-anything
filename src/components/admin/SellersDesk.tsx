"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPlanPrice } from "@/config/seller-plans";
import type { SellerProfile } from "@/types/seller";

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  suspended: "bg-red-100 text-red-800",
  rejected: "bg-neutral-200 text-neutral-700",
  draft: "bg-neutral-100 text-neutral-700",
};

export function SellersDesk({ sellers }: { sellers: SellerProfile[] }) {
  return (
    <Card variant="elevated" className="overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Shop</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sellers.map((seller) => (
              <tr key={seller.id} className="border-b border-neutral-50 hover:bg-neutral-50/80">
                <td className="px-4 py-3 font-medium">{seller.shopName}</td>
                <td className="px-4 py-3 text-neutral-600">{seller.companyName}</td>
                <td className="px-4 py-3">{formatPlanPrice(seller.plan)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[seller.status] ?? ""}`}>
                    {seller.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge>{seller.subscriptionStatus}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/sellers/${seller.id}`}>
                    <Button variant="secondary" size="sm">Review</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
