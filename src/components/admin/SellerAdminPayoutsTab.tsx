"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SellerNeedsAttentionButton } from "@/components/admin/SellerNeedsAttentionButton";
import { formatCurrency } from "@/lib/utils/cn";
import type { SellerPayout } from "@/types/seller";

const STATUS_CLASS: Record<SellerPayout["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export function SellerAdminPayoutsTab({
  sellerId,
  shopName,
  payouts: initialPayouts,
  canManage,
}: {
  sellerId: string;
  shopName: string;
  payouts: SellerPayout[];
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
      if (!res.ok) return;
      setPayouts((prev) => prev.map((p) => (p.id === payoutId ? { ...p, status } : p)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Payout requests</h2>
          <p className="mt-1 text-sm text-neutral-600">Approve, mark paid, or reject payout requests for this seller.</p>
        </div>
        {canManage ? <SellerNeedsAttentionButton sellerId={sellerId} shopName={shopName} /> : null}
      </div>
      <ul className="mt-4 space-y-2">
        {payouts.map((payout) => (
          <li key={payout.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{formatCurrency(payout.amount, payout.currency)}</p>
              <p className="text-xs text-neutral-500">{new Date(payout.requestedAt).toLocaleString()}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_CLASS[payout.status]}`}>
                {payout.status}
              </span>
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
            </div>
          </li>
        ))}
        {!payouts.length ? <p className="text-sm text-neutral-500">No payout requests yet.</p> : null}
      </ul>
    </Card>
  );
}
