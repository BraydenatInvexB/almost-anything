export type SellerListingStatus =
  | "draft"
  | "published"
  | "pending_review"
  | "flagged"
  | "removed"
  | "archived";

export const SELLER_LISTING_STATUSES: SellerListingStatus[] = [
  "draft",
  "published",
  "pending_review",
  "flagged",
  "removed",
  "archived",
];

export const SELLER_LISTING_STATUS_META: Record<
  SellerListingStatus,
  { label: string; className: string; description: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-neutral-100 text-neutral-700",
    description: "Saved privately — not visible to customers",
  },
  published: {
    label: "Published",
    className: "bg-emerald-100 text-emerald-800",
    description: "Live on the marketplace",
  },
  pending_review: {
    label: "Pending review",
    className: "bg-amber-100 text-amber-800",
    description: "Awaiting platform approval",
  },
  flagged: {
    label: "Flagged",
    className: "bg-orange-100 text-orange-800",
    description: "Needs seller action or admin review",
  },
  removed: {
    label: "Removed",
    className: "bg-red-100 text-red-800",
    description: "Hidden from customers by admin",
  },
  archived: {
    label: "Archived",
    className: "bg-neutral-200 text-neutral-700",
    description: "Seller archived listing",
  },
};

export function normalizeListingStatus(value: string | null | undefined): SellerListingStatus {
  if (value && value in SELLER_LISTING_STATUS_META) {
    return value as SellerListingStatus;
  }
  return "draft";
}
