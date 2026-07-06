"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SellerNeedsAttentionButton } from "@/components/admin/SellerNeedsAttentionButton";
import { formatCurrency } from "@/lib/utils/cn";
import type { SellerPayoutQueueRow } from "@/types/seller-admin";

const STATUS_CLASS: Record<SellerPayoutQueueRow["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export function SellersPayoutsQueue({
  payouts: initialPayouts,
  canManage,
}: {
  payouts: SellerPayoutQueueRow[];
  canManage: boolean;
}) {
  const [payouts, setPayouts] = useState(initialPayouts);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(payoutId: string, status: "approved" | "paid" | "rejected") {
    setBusyId(payoutId);
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not update payout");
      }
      setPayouts((prev) => prev.map((p) => (p.id === payoutId ? { ...p, status } : p)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card variant="elevated" className="overflow-hidden bg-white">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="text-lg font-semibold">Payout requests</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Approve or reject seller payout requests without opening each seller profile.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id} className="border-b border-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/sellers/${payout.sellerId}?tab=payouts`} className="font-medium hover:text-brand">
                    {payout.sellerShopName}
                  </Link>
                  <p className="text-xs text-neutral-500">{payout.sellerCompanyName}</p>
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(payout.amount, payout.currency)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_CLASS[payout.status]}`}>
                    {payout.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(payout.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {canManage && payout.status === "pending" ? (
                      <>
                        <Button size="sm" disabled={busyId === payout.id} onClick={() => void updateStatus(payout.id, "approved")}>
                          Approve
                        </Button>
                        <Button size="sm" disabled={busyId === payout.id} onClick={() => void updateStatus(payout.id, "paid")}>
                          Mark paid
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" disabled={busyId === payout.id} onClick={() => void updateStatus(payout.id, "rejected")}>
                          Reject
                        </Button>
                      </>
                    ) : null}
                    {canManage ? (
                      <SellerNeedsAttentionButton sellerId={payout.sellerId} shopName={payout.sellerShopName} />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!payouts.length ? (
        <p className="p-6 text-sm text-neutral-500">No payout requests in this queue.</p>
      ) : null}
    </Card>
  );
}
