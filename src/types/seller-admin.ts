import type { SellerListingStatus } from "@/config/seller-listing-status";

export type SellerMessagePriority = "normal" | "important" | "action_required";

export interface SellerAdminProduct {
  id: string;
  name: string;
  slug: string;
  retailPrice: number;
  stockQuantity: number;
  category: string;
  listingStatus: SellerListingStatus;
  imageUrl?: string;
  moderationNote?: string;
  updatedAt: string;
}

export interface SellerMessage {
  id: string;
  sellerId: string;
  senderType: "admin" | "seller";
  senderName: string;
  subject: string;
  body: string;
  priority: SellerMessagePriority;
  readAt?: string;
  createdAt: string;
}

export type SellerDeskFilter = "all" | "pending_review" | "approved" | "suspended" | "rejected";
