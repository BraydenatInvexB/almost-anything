"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StorefrontSectionToggles } from "@/components/admin/StorefrontSectionToggles";
import { SELLER_LISTING_STATUS_META, type SellerListingStatus } from "@/config/seller-listing-status";
import type { StorefrontSectionFlags } from "@/config/storefront-sections";
import { formatCurrency } from "@/lib/utils/cn";
import type { SellerAdminCatalogProduct } from "@/types/seller-admin";

const MODERATION: { status: SellerListingStatus; label: string }[] = [
  { status: "published", label: "Publish" },
  { status: "flagged", label: "Flag" },
  { status: "removed", label: "Remove" },
];

export function SellerProductsManagerRow({
  product,
  sections,
  sectionSaving,
  canEdit,
  canManage,
  onUpdateSections,
  onModerate,
  busyId,
}: {
  product: SellerAdminCatalogProduct;
  sections: StorefrontSectionFlags;
  sectionSaving: boolean;
  canEdit: boolean;
  canManage: boolean;
  onUpdateSections: (product: SellerAdminCatalogProduct, next: StorefrontSectionFlags) => void;
  onModerate: (product: SellerAdminCatalogProduct, status: SellerListingStatus) => void;
  busyId: string | null;
}) {
  const meta = SELLER_LISTING_STATUS_META[product.listingStatus];

  return (
    <tr className="align-top">
      <td className="px-3 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-white">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.imageUrl} alt="" className="h-full w-full object-contain" />
            ) : null}
          </div>
          <div className="min-w-0">
            <Link href={`/products/${product.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-brand">
              {product.name}
            </Link>
            <p className="mt-0.5 truncate text-xs text-neutral-500">{product.category}</p>
          </div>
        </div>
      </td>
      <td className="hidden px-2 py-3 sm:table-cell">
        <Link href={`/admin/sellers/${product.sellerId}`} className="text-sm font-medium hover:text-brand">
          {product.sellerShopName}
        </Link>
        <p className="truncate text-xs text-neutral-500">{product.sellerCompanyName}</p>
      </td>
      <td className="hidden px-2 py-3 md:table-cell">{formatCurrency(product.retailPrice)}</td>
      <td className="hidden px-2 py-3 lg:table-cell">{product.stockQuantity}</td>
      <td className="px-2 py-3">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>
          {meta.label}
        </span>
      </td>
      <td className="hidden px-2 py-3 lg:table-cell">
        <StorefrontSectionToggles
          compact
          disabled={!canEdit || sectionSaving}
          value={sections}
          onChange={(next) => onUpdateSections(product, next)}
        />
      </td>
      <td className="px-2 py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          <Link href={`/products/${product.slug}`} className="text-neutral-400 hover:text-brand">
            <ExternalLink className="h-4 w-4" />
          </Link>
          {canManage ? (
            <div className="flex flex-wrap justify-end gap-1">
              {MODERATION.map((action) => (
                <button
                  key={action.status}
                  type="button"
                  disabled={busyId === product.id}
                  onClick={() => onModerate(product, action.status)}
                  className="rounded-full border border-neutral-200 px-2 py-0.5 text-[10px] font-semibold uppercase hover:bg-neutral-50"
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
