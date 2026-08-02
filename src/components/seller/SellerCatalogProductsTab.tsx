"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ImagePlus, Plus, Upload } from "lucide-react";
import { BtnPrimary, BtnSecondary, EmptyState, Table, Td, Th } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import {
  formatDeliveryWindow,
  formatMarginCell,
  formatProductDelivery,
} from "@/lib/seller/catalog-display";
import { SellerCatalogToolbar } from "@/components/seller/SellerCatalogToolbar";
import { SellerCatalogListingActions } from "@/components/seller/SellerCatalogListingActions";
import { SellerListingBadge } from "@/components/seller/SellerListingBadge";
import { SellerStockBadge } from "@/components/seller/SellerPanel";
import { normalizeListingStatus } from "@/config/seller-listing-status";
import { hasSellerSupplier, parseSellerSupplier } from "@/lib/seller/product-supplier";
import type { SellerCatalogProduct, SellerCatalogShipping } from "@/types/seller-catalog";

const LISTING_FILTERS = [
  { id: "all", label: "All listings" },
  { id: "draft", label: "Drafts" },
  { id: "live", label: "Live & pending" },
] as const;

export function SellerCatalogProductsTab({
  products,
  shipping,
  sellerApproved,
  onGoAdd,
  onGoImport,
  canEdit,
  onEdit,
  onListingUpdated,
  onArchived,
}: {
  products: SellerCatalogProduct[];
  shipping: SellerCatalogShipping;
  sellerApproved: boolean;
  onGoAdd: () => void;
  onGoImport: () => void;
  canEdit: boolean;
  onEdit: (product: SellerCatalogProduct) => void;
  onListingUpdated: (productId: string, listingStatus: string) => void;
  onArchived: (productId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [listingFilter, setListingFilter] = useState<(typeof LISTING_FILTERS)[number]["id"]>("all");

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(products.map((p) => p.category ?? "general")))],
    [products],
  );

  const filtered = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.slug.toLowerCase().includes(query.toLowerCase());
    const matchesCat = category === "all" || (p.category ?? "general") === category;
    const status = normalizeListingStatus(p.listing_status);
    const matchesListing =
      listingFilter === "all"
        ? true
        : listingFilter === "draft"
          ? status === "draft"
          : status === "published" || status === "pending_review";
    return matchesQuery && matchesCat && matchesListing;
  });

  if (!products.length) {
    return (
      <div className="rounded-xl border border-neutral-200/80 bg-white shadow-sm">
        <EmptyState
          title="Your catalog is empty"
          description="Add products or import a stock list CSV with cost, markup, and pricing columns."
        />
        {canEdit ? (
          <div className="flex justify-center gap-2 pb-10">
            <BtnSecondary onClick={onGoImport}>
              <Upload className="h-4 w-4" />
              Import stock list
            </BtnSecondary>
            <BtnPrimary onClick={onGoAdd}>
              <Plus className="h-4 w-4" />
              Add product
            </BtnPrimary>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex flex-1 flex-col gap-3 lg:flex-row">
          <div className="flex-1">
            <SellerCatalogToolbar
              query={query}
              onQueryChange={setQuery}
              category={category}
              onCategoryChange={setCategory}
              categories={categories}
            />
          </div>
          <select
            value={listingFilter}
            onChange={(e) => setListingFilter(e.target.value as typeof listingFilter)}
            className="input h-10 w-full min-w-[160px] lg:w-auto"
          >
            {LISTING_FILTERS.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
        {canEdit ? (
          <div className="flex shrink-0 gap-2">
            <BtnSecondary onClick={onGoImport}>
              <Upload className="h-4 w-4" />
              Import CSV
            </BtnSecondary>
            <BtnPrimary onClick={onGoAdd}>
              <Plus className="h-4 w-4" />
              Add product
            </BtnPrimary>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200/80 bg-white shadow-sm">
        <Table>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Cost</Th>
              <Th>Markup</Th>
              <Th>Retail</Th>
              <Th>Margin</Th>
              <Th>Delivery</Th>
              <Th>Stock</Th>
              <Th>Status</Th>
              {canEdit ? <Th>Actions</Th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {filtered.map((product) => {
              const supplier = parseSellerSupplier(product.metadata);
              const supplierLabel = hasSellerSupplier(supplier)
                ? supplier.name || "Supplier tracked"
                : null;
              return (
              <tr key={product.id} className="hover:bg-neutral-50/70">
                <Td>
                  <div className="flex min-w-[200px] items-center gap-3">
                    <Thumb
                      imageUrl={product.image_url}
                      name={product.name}
                      canEdit={canEdit}
                      onEdit={() => onEdit(product)}
                    />
                    <div className="min-w-0">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          className="text-left font-medium text-neutral-950 hover:text-brand hover:underline"
                        >
                          {product.name}
                        </button>
                      ) : (
                        <p className="font-medium text-neutral-950">{product.name}</p>
                      )}
                      <p className="text-xs text-neutral-400">{formatDeliveryWindow(product)}</p>
                      {supplierLabel ? (
                        <p className="mt-0.5 truncate text-[11px] text-neutral-500">
                          Supplier: {supplierLabel}
                        </p>
                      ) : null}
                      {canEdit && !product.image_url ? (
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:underline"
                        >
                          <ImagePlus className="h-3 w-3" />
                          Add photos
                        </button>
                      ) : null}
                    </div>
                  </div>
                </Td>
                <Td className="tabular-nums">{formatCurrency(Number(product.base_price), "ZAR")}</Td>
                <Td className="tabular-nums">{Number(product.markup_percent).toFixed(1)}%</Td>
                <Td className="font-semibold tabular-nums">
                  {formatCurrency(Number(product.retail_price), "ZAR")}
                </Td>
                <Td className="font-medium text-emerald-700">{formatMarginCell(product)}</Td>
                <Td className="max-w-[160px] text-xs text-neutral-600">
                  {formatProductDelivery(product, shipping)}
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">
                      {Number(product.stock_quantity).toLocaleString()}
                    </span>
                    <SellerStockBadge quantity={Number(product.stock_quantity)} />
                  </div>
                </Td>
                <Td>
                  <SellerListingBadge status={product.listing_status} />
                </Td>
                {canEdit ? (
                  <Td>
                    <SellerCatalogListingActions
                      product={product}
                      sellerApproved={sellerApproved}
                      canEdit={canEdit}
                      onEdit={onEdit}
                      onUpdated={onListingUpdated}
                      onArchived={onArchived}
                    />
                  </Td>
                ) : null}
              </tr>
              );
            })}
          </tbody>
        </Table>
        {!filtered.length ? (
          <p className="px-6 py-8 text-center text-sm text-neutral-500">
            No products match your filters.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Thumb({
  imageUrl,
  name,
  canEdit,
  onEdit,
}: {
  imageUrl: string | null;
  name: string;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const body = (
    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
      {imageUrl ? (
        <Image src={imageUrl} alt={name} fill className="object-cover" sizes="48px" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-neutral-400">
          <ImagePlus className="h-4 w-4" />
          <span className="text-[9px] font-bold">Photo</span>
        </div>
      )}
    </div>
  );

  if (!canEdit) return body;

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group relative rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      title={imageUrl ? "Edit product & photos" : "Add product photos"}
    >
      {body}
      <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-950/0 text-[10px] font-semibold text-white opacity-0 transition group-hover:bg-neutral-950/45 group-hover:opacity-100">
        Edit
      </span>
    </button>
  );
}
