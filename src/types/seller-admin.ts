import type { SellerListingStatus } from "@/config/seller-listing-status";
import type { SellerDocument } from "@/types/seller";

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

export interface SellerAdminCatalogProduct extends SellerAdminProduct {
  sellerId: string;
  sellerShopName: string;
  sellerCompanyName: string;
  basePrice: number;
  markupPercent: number;
  showInHot: boolean;
  showInSteals: boolean;
  showInFreshDrops: boolean;
  isDeal: boolean;
  dealDiscountPercent: number | null;
}

export interface SellerDocumentQueueRow {
  id: string;
  sellerId: string;
  sellerShopName: string;
  sellerCompanyName: string;
  docType: SellerDocument["docType"];
  docLabel: string;
  fileName: string;
  fileUrl: string;
  status: SellerDocument["status"];
  notes?: string;
  uploadedAt: string;
}

export interface SellerPayoutQueueRow {
  id: string;
  sellerId: string;
  sellerShopName: string;
  sellerCompanyName: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "rejected";
  requestedAt: string;
  notes?: string;
}

export type SellersAdminView = "sellers" | "products" | "documents" | "payouts";
export type AdminCatalogTab = "platform" | "seller";

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
