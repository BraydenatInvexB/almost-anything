export type SellerEntityType =
  | "sole_proprietor"
  | "partnership"
  | "private_company"
  | "public_company"
  | "close_corporation"
  | "trust"
  | "npo"
  | "other";

export type SellerStatus = "draft" | "pending_review" | "approved" | "suspended" | "rejected";
export type SellerPlan = "starter_30" | "growth_50" | "unlimited";
export type SellerSubscriptionStatus = "trial" | "active" | "past_due" | "cancelled";
export type { SellerDocumentType } from "@/config/seller-document-requirements";
import type { SellerDocumentType } from "@/config/seller-document-requirements";

export type SellerTeamRole = "owner" | "manager" | "inventory" | "support" | "staff";
export type SellerPayoutStatus = "pending" | "approved" | "paid" | "rejected";

export interface SellerBusinessAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface SellerProfile {
  id: string;
  userId?: string;
  shopName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  companyName: string;
  entityType: SellerEntityType;
  registrationNumber?: string;
  vatNumber?: string;
  contactEmail: string;
  contactPhone: string;
  businessAddress: SellerBusinessAddress;
  categorySlugs: string[];
  sellsAllCategories: boolean;
  status: SellerStatus;
  plan: SellerPlan;
  subscriptionStatus: SellerSubscriptionStatus;
  subscriptionStartsAt?: string;
  firstSaleAt?: string;
  preferredCouriers: string[];
  role: SellerTeamRole;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SellerDocument {
  id: string;
  sellerId: string;
  docType: SellerDocumentType;
  fileName: string;
  fileUrl: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
  uploadedAt: string;
}

export interface SellerTeamMember {
  id: string;
  sellerId: string;
  userId?: string;
  email: string;
  fullName: string;
  role: SellerTeamRole;
  status: "invited" | "active" | "suspended";
  permissions: string[];
  createdAt: string;
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  amount: number;
  currency: string;
  periodStart?: string;
  periodEnd?: string;
  status: SellerPayoutStatus;
  notes?: string;
  requestedAt: string;
  processedAt?: string;
}

export interface SellerApplicationInput {
  shopName: string;
  companyName: string;
  entityType: SellerEntityType;
  registrationNumber?: string;
  vatNumber?: string;
  contactEmail: string;
  contactPhone: string;
  description?: string;
  plan: SellerPlan;
  categorySlugs: string[];
  sellsAllCategories: boolean;
  businessAddress: SellerBusinessAddress;
}

export interface SellerDashboardStats {
  productCount: number;
  productLimit: number | null;
  orderCount: number;
  revenueTotal: number;
  pendingOrders: number;
  lowStockCount: number;
  subscriptionStatus: SellerSubscriptionStatus;
  planLabel: string;
}
