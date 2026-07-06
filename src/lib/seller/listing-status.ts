import type { SellerListingStatus } from "@/config/seller-listing-status";
import type { SellerProfile } from "@/types/seller";

export type SellerSaveIntent = "draft" | "list";

/** Statuses sellers can set when listing or unlisting their own products. */
export const SELLER_SELF_SERVICE_STATUSES: SellerListingStatus[] = ["draft", "published", "pending_review"];

/** Admin-controlled statuses — seller cannot override without support. */
export const SELLER_LOCKED_LISTING_STATUSES: SellerListingStatus[] = ["flagged", "removed", "archived"];

export function resolveListingStatusForSave(
  seller: Pick<SellerProfile, "status">,
  intent: SellerSaveIntent,
): SellerListingStatus {
  if (intent === "draft") return "draft";
  return seller.status === "approved" ? "published" : "pending_review";
}

export function resolveListingStatusForPublish(
  seller: Pick<SellerProfile, "status">,
  currentStatus: SellerListingStatus,
): SellerListingStatus {
  if (SELLER_LOCKED_LISTING_STATUSES.includes(currentStatus)) {
    throw new Error("This listing is locked by the marketplace team. Contact support to relist.");
  }
  return resolveListingStatusForSave(seller, "list");
}

export function canSellerChangeListing(status: string | null | undefined): boolean {
  if (!status) return true;
  return !SELLER_LOCKED_LISTING_STATUSES.includes(status as SellerListingStatus);
}

export function listingIntentLabel(intent: SellerSaveIntent, sellerApproved: boolean): string {
  if (intent === "draft") return "Save as draft";
  return sellerApproved ? "List product" : "Submit for listing";
}

export function listingSuccessMessage(status: SellerListingStatus): string {
  if (status === "draft") return "Draft saved — not visible to customers yet.";
  if (status === "pending_review") return "Listing submitted for marketplace review.";
  return "Product is now live on your storefront.";
}
