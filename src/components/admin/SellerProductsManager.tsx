"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/admin/ui";
import { flagsFromSellerProduct } from "@/lib/admin/seller-product-mapper";
import { SellerProductsManagerRow } from "@/components/admin/SellerProductsManagerRow";
import type { StorefrontSectionFlags } from "@/config/storefront-sections";
import { storefrontSectionPatch } from "@/lib/product/deal-flags";
import type { SellerListingStatus } from "@/config/seller-listing-status";
import type { SellerAdminCatalogProduct } from "@/types/seller-admin";

export function SellerProductsManager({
  products: initialProducts,
  canEdit,
  canManage,
}: {
  products: SellerAdminCatalogProduct[];
  canEdit: boolean;
  canManage: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [listingFilter, setListingFilter] = useState("all");
  const [sections, setSections] = useState<Record<string, StorefrontSectionFlags>>(
    Object.fromEntries(items.map((p) => [p.id, flagsFromSellerProduct(p)])),
  );
  const [sectionSaving, setSectionSaving] = useState<Record<string, boolean>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const listingOptions = useMemo(
    () => ["all", ...Array.from(new Set(items.map((p) => p.listingStatus)))],
    [items],
  );

  const filtered = items.filter((p) => {
    const q = query.toLowerCase();
    const matchesQuery =
      p.name.toLowerCase().includes(q) ||
      p.sellerShopName.toLowerCase().includes(q) ||
      p.sellerCompanyName.toLowerCase().includes(q);
    const matchesStatus = listingFilter === "all" || p.listingStatus === listingFilter;
    return matchesQuery && matchesStatus;
  });

  async function updateSections(product: SellerAdminCatalogProduct, next: StorefrontSectionFlags) {
    setSections((s) => ({ ...s, [product.id]: next }));
    if (!canEdit) return;

    setSectionSaving((s) => ({ ...s, [product.id]: true }));
    try {
      const patch = storefrontSectionPatch(
        { is_deal: product.isDeal, deal_discount_percent: product.dealDiscountPercent },
        next,
      );
      const res = await fetch("/api/admin/seller-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          show_in_hot: patch.show_in_hot,
          show_in_steals: patch.show_in_steals,
          show_in_fresh_drops: patch.show_in_fresh_drops,
        }),
      });
      if (!res.ok) {
        setSections((s) => ({ ...s, [product.id]: flagsFromSellerProduct(product) }));
        return;
      }
      const data = await res.json();
      if (data.product) {
        setItems((prev) => prev.map((p) => (p.id === product.id ? data.product : p)));
      }
      router.refresh();
    } catch {
      setSections((s) => ({ ...s, [product.id]: flagsFromSellerProduct(product) }));
    } finally {
      setSectionSaving((s) => ({ ...s, [product.id]: false }));
    }
  }

  async function moderate(product: SellerAdminCatalogProduct, listingStatus: SellerListingStatus) {
    setBusyId(product.id);
    try {
      const res = await fetch("/api/admin/seller-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product.id,
          sellerId: product.sellerId,
          listingStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.product) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, listingStatus: data.product.listingStatus } : p,
          ),
        );
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search seller products or shops..."
            className="h-9 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm focus:border-neutral-300 focus:bg-white focus:outline-none"
          />
        </div>
        <select
          value={listingFilter}
          onChange={(e) => setListingFilter(e.target.value)}
          className="h-9 rounded-full border border-neutral-200 bg-white px-4 text-sm capitalize focus:outline-none"
        >
          {listingOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All listing statuses" : option.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <p className="border-b border-neutral-100 px-4 pb-3 text-xs text-neutral-500">
        Toggle <span className="font-semibold text-neutral-700">Hot</span>,{" "}
        <span className="font-semibold text-neutral-700">Deals</span>, and{" "}
        <span className="font-semibold text-neutral-700">Fresh</span> to feature seller listings on the storefront.
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="No seller products match your filters" description="Try another search or listing status." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80">
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Product</th>
                <th className="hidden px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 sm:table-cell">Seller</th>
                <th className="hidden px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 md:table-cell">Price</th>
                <th className="hidden px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 lg:table-cell">Stock</th>
                <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Status</th>
                <th className="hidden px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 lg:table-cell">Storefront</th>
                <th className="px-2 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((product) => (
                <SellerProductsManagerRow
                  key={product.id}
                  product={product}
                  sections={sections[product.id] ?? flagsFromSellerProduct(product)}
                  sectionSaving={sectionSaving[product.id] ?? false}
                  canEdit={canEdit}
                  canManage={canManage}
                  busyId={busyId}
                  onUpdateSections={updateSections}
                  onModerate={moderate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
