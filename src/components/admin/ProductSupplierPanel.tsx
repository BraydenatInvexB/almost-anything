"use client";

import { ExternalLink, Globe, MapPin, Package, Phone, Mail } from "lucide-react";
import type { ProductSupplierIntel, SupplierListing, SupplierRegion } from "@/types/supplier-sourcing";
import { formatCurrency } from "@/lib/utils/cn";

type Props = {
  sourceName?: string;
  sourceUrl?: string;
  basePrice?: number;
  supplierIntel?: ProductSupplierIntel;
};

const REGION_LABEL: Record<SupplierRegion, string> = {
  south_africa: "South Africa",
  international: "International",
  unknown: "Unknown",
};

const TIER_LABEL: Record<SupplierListing["tier"], string> = {
  manufacturer: "Manufacturer",
  wholesale: "Wholesale",
  trade: "Trade",
  distributor: "Distributor",
  retail: "Retail",
};

function formatWholesaleCost(listing: SupplierListing): string {
  if (listing.wholesalePriceZar != null && listing.wholesalePriceZar > 0) {
    return formatCurrency(listing.wholesalePriceZar, "ZAR");
  }
  if (listing.wholesalePriceUsd != null && listing.wholesalePriceUsd > 0) {
    return `$${listing.wholesalePriceUsd.toFixed(2)} USD`;
  }
  return "—";
}

function SupplierCard({
  listing,
  isPrimary,
}: {
  listing: SupplierListing;
  isPrimary?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        isPrimary ? "border-emerald-200 bg-emerald-50/40" : "border-neutral-200 bg-neutral-50/50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isPrimary && (
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Primary
              </span>
            )}
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600 ring-1 ring-neutral-200">
              {TIER_LABEL[listing.tier]}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-500 ring-1 ring-neutral-200">
              {REGION_LABEL[listing.region]}
            </span>
          </div>
          <p className="mt-2 font-semibold text-neutral-900">{listing.supplierName}</p>
          {listing.listingTitle && (
            <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{listing.listingTitle}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Wholesale</p>
          <p className="text-sm font-bold text-neutral-900">{formatWholesaleCost(listing)}</p>
          {listing.moq != null && listing.moq > 1 && (
            <p className="mt-0.5 text-xs text-neutral-500">MOQ {listing.moq}</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600">
        {(listing.city || listing.country) && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {[listing.city, listing.country].filter(Boolean).join(", ")}
          </span>
        )}
        {listing.leadTimeDaysMin != null && (
          <span className="inline-flex items-center gap-1">
            <Package className="h-3 w-3 shrink-0" />
            {listing.leadTimeDaysMax != null && listing.leadTimeDaysMax !== listing.leadTimeDaysMin
              ? `${listing.leadTimeDaysMin}–${listing.leadTimeDaysMax} days`
              : `${listing.leadTimeDaysMin} days`}
          </span>
        )}
        {listing.contactEmail && (
          <a href={`mailto:${listing.contactEmail}`} className="inline-flex items-center gap-1 hover:text-brand">
            <Mail className="h-3 w-3 shrink-0" />
            {listing.contactEmail}
          </a>
        )}
        {listing.contactPhone && (
          <span className="inline-flex items-center gap-1">
            <Phone className="h-3 w-3 shrink-0" />
            {listing.contactPhone}
          </span>
        )}
      </div>

      {listing.notes && (
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">{listing.notes}</p>
      )}

      {listing.supplierUrl && (
        <a
          href={listing.supplierUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open supplier listing
        </a>
      )}
    </div>
  );
}

export function ProductSupplierPanel({ sourceName, sourceUrl, basePrice, supplierIntel }: Props) {
  const hasIntel = Boolean(supplierIntel?.primary);
  const alternates = supplierIntel?.alternates ?? [];

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">Supplier & procurement</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Wholesale sources used to price this product. Use these links to place purchase orders.
          </p>
        </div>
        {supplierIntel?.searchedAt && (
          <p className="text-[11px] text-neutral-400">
            Researched {new Date(supplierIntel.searchedAt).toLocaleString("en-ZA")}
          </p>
        )}
      </div>

      {!hasIntel && (
        <div className="mt-4 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 p-4">
          <p className="text-sm font-medium text-neutral-700">
            {sourceName || "No supplier linked"}
          </p>
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {sourceUrl}
            </a>
          ) : (
            <p className="mt-1 text-xs text-neutral-400">
              Manually add a supplier name and listing URL above, or run product discovery to auto-research wholesale options.
            </p>
          )}
          {basePrice != null && basePrice > 0 && (
            <p className="mt-2 text-xs text-neutral-500">
              Catalog cost price: {formatCurrency(basePrice, "ZAR")}
            </p>
          )}
        </div>
      )}

      {hasIntel && supplierIntel && (
        <div className="mt-4 space-y-4">
          {supplierIntel.cheapestWholesaleZar != null && (
            <p className="text-xs text-neutral-600">
              Cheapest wholesale found:{" "}
              <span className="font-semibold text-emerald-700">
                {formatCurrency(supplierIntel.cheapestWholesaleZar, "ZAR")}
              </span>
              {supplierIntel.searchQuery && (
                <span className="text-neutral-400"> · query “{supplierIntel.searchQuery}”</span>
              )}
            </p>
          )}

          <SupplierCard listing={supplierIntel.primary} isPrimary />

          {alternates.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Alternate suppliers ({alternates.length})
              </p>
              <div className="space-y-2">
                {alternates.map((listing) => (
                  <SupplierCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          )}

          {supplierIntel.researchNotes && (
            <div className="rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-relaxed text-neutral-600">
              <Globe className="mb-1 inline h-3.5 w-3.5 text-neutral-400" />{" "}
              {supplierIntel.researchNotes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
