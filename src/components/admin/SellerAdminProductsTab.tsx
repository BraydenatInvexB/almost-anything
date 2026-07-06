"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SELLER_LISTING_STATUS_META, type SellerListingStatus } from "@/config/seller-listing-status";
import { formatCurrency } from "@/lib/utils/cn";
import type { SellerAdminProduct } from "@/types/seller-admin";

const MODERATION_ACTIONS: { status: SellerListingStatus; label: string }[] = [
  { status: "published", label: "Publish" },
  { status: "flagged", label: "Flag" },
  { status: "removed", label: "Remove" },
  { status: "pending_review", label: "Review" },
];

export function SellerAdminProductsTab({
  sellerId,
  canManage,
}: {
  sellerId: string;
  canManage: boolean;
}) {
  const [products, setProducts] = useState<SellerAdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/sellers/${sellerId}/products`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products ?? []))
      .finally(() => setLoading(false));
  }, [sellerId]);

  async function moderate(productId: string, listingStatus: SellerListingStatus) {
    setBusyId(productId);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/products`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, listingStatus, note: note || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setProducts((prev) => prev.map((p) => (p.id === productId ? data.product : p)));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Loading products…</p>;

  return (
    <div className="space-y-4">
      {canManage ? (
        <Card variant="default" className="p-4">
          <p className="text-sm font-medium text-neutral-900">Moderation note (optional)</p>
          <Input
            className="mt-2 rounded-xl"
            placeholder="Reason shown internally and to the seller when flagged/removed"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Card>
      ) : null}

      <Card variant="elevated" className="overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Note</th>
                {canManage ? <th className="px-4 py-3" /> : null}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const meta = SELLER_LISTING_STATUS_META[product.listingStatus];
                return (
                  <tr key={product.id} className="border-b border-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/products/${product.slug}`} className="font-medium hover:text-brand">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatCurrency(product.retailPrice)}</td>
                    <td className="px-4 py-3">{product.stockQuantity}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">{product.moderationNote ?? "—"}</td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {MODERATION_ACTIONS.map((action) => (
                            <Button
                              key={action.status}
                              size="sm"
                              variant={product.listingStatus === action.status ? "primary" : "secondary"}
                              disabled={busyId === product.id}
                              onClick={() => void moderate(product.id, action.status)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!products.length ? (
          <p className="p-6 text-sm text-neutral-500">This seller has not listed any products yet.</p>
        ) : null}
      </Card>
    </div>
  );
}
