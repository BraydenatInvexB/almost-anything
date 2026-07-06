"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatPlanPrice } from "@/config/seller-plans";
import { getSellerEntityLabel } from "@/config/seller-entity-types";
import { SellerAdminDocumentsPanel } from "@/components/admin/SellerAdminDocumentsPanel";
import type { SellerDocument, SellerPayout, SellerProfile } from "@/types/seller";

export function SellerDetailPanel({
  seller,
  documents,
  payouts,
}: {
  seller: SellerProfile;
  documents: SellerDocument[];
  payouts: SellerPayout[];
}) {
  const [status, setStatus] = useState(seller.status);
  const [busy, setBusy] = useState(false);

  async function updateStatus(action: "approve" | "suspend" | "reject") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: seller.id, action }),
      });
      if (res.ok) {
        const map = { approve: "approved", suspend: "suspended", reject: "rejected" } as const;
        setStatus(map[action]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/sellers" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" />
        Back to sellers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{seller.shopName}</h1>
          <p className="text-neutral-600">{seller.companyName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => void updateStatus("approve")}>Approve</Button>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void updateStatus("suspend")}>Suspend</Button>
          <Button size="sm" variant="ghost" className="text-red-500" disabled={busy} onClick={() => void updateStatus("reject")}>Reject</Button>
        </div>
      </div>

      <Card variant="elevated" className="p-6">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="text-neutral-500">Status</dt><dd className="font-medium capitalize">{status.replace("_", " ")}</dd></div>
          <div><dt className="text-neutral-500">Plan</dt><dd>{formatPlanPrice(seller.plan)}</dd></div>
          <div><dt className="text-neutral-500">Subscription</dt><dd className="capitalize">{seller.subscriptionStatus}</dd></div>
          <div><dt className="text-neutral-500">Contact</dt><dd>{seller.contactEmail} · {seller.contactPhone}</dd></div>
          <div><dt className="text-neutral-500">Entity type</dt><dd>{getSellerEntityLabel(seller.entityType)}</dd></div>
          <div><dt className="text-neutral-500">Registration</dt><dd>{seller.registrationNumber ?? "—"}</dd></div>
          <div><dt className="text-neutral-500">VAT</dt><dd>{seller.vatNumber ?? "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-neutral-500">Categories</dt><dd>{seller.sellsAllCategories ? "All categories" : seller.categorySlugs.join(", ") || "—"}</dd></div>
        </dl>
      </Card>

      <SellerAdminDocumentsPanel seller={seller} documents={documents} />

      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Payout requests</h2>
        <ul className="mt-4 space-y-2">
          {payouts.map((payout) => (
            <li key={payout.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 text-sm">
              <span>R{payout.amount.toFixed(2)}</span>
              <span className="capitalize">{payout.status}</span>
            </li>
          ))}
          {!payouts.length ? <p className="text-sm text-neutral-500">No payout requests yet.</p> : null}
        </ul>
      </Card>
    </div>
  );
}
