import { cn } from "@/lib/utils/cn";
import { normalizeListingStatus, SELLER_LISTING_STATUS_META } from "@/config/seller-listing-status";

export function SellerListingBadge({ status }: { status: string | null | undefined }) {
  const normalized = normalizeListingStatus(status);
  const meta = SELLER_LISTING_STATUS_META[normalized];
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset ring-black/5",
        meta.className,
      )}
      title={meta.description}
    >
      {meta.label}
    </span>
  );
}
