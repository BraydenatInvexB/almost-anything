import {
  evaluateSellerDocumentCompliance,
  evaluateRequiredDocumentsApproved,
} from "@/lib/seller/document-compliance";
import type { SellerDocument, SellerProfile } from "@/types/seller";

export type SellerAccessPhase =
  | "submit_documents"
  | "awaiting_review"
  | "approved"
  | "suspended"
  | "rejected";

export interface SellerAccessState {
  phase: SellerAccessPhase;
  canUseDashboard: boolean;
  redirectTo: string | null;
  compliance: ReturnType<typeof evaluateSellerDocumentCompliance>;
  documentsApproved: boolean;
}

export const SELLER_LOCKED_PATHS = ["/seller/settings", "/seller/verification"] as const;

export function isSellerLockedPath(pathname: string): boolean {
  return SELLER_LOCKED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function evaluateSellerAccess(
  seller: SellerProfile,
  documents: SellerDocument[],
): SellerAccessState {
  const compliance = evaluateSellerDocumentCompliance(seller.entityType, documents);
  const { isApproved: documentsApproved } = evaluateRequiredDocumentsApproved(
    seller.entityType,
    documents,
  );

  if (seller.status === "suspended") {
    return {
      phase: "suspended",
      canUseDashboard: false,
      redirectTo: "/seller/verification",
      compliance,
      documentsApproved,
    };
  }

  if (seller.status === "rejected") {
    return {
      phase: "rejected",
      canUseDashboard: false,
      redirectTo: "/seller/verification",
      compliance,
      documentsApproved,
    };
  }

  if (seller.status === "approved") {
    return {
      phase: "approved",
      canUseDashboard: true,
      redirectTo: null,
      compliance,
      documentsApproved,
    };
  }

  if (!compliance.isComplete) {
    return {
      phase: "submit_documents",
      canUseDashboard: false,
      redirectTo: "/seller/settings?onboarding=1",
      compliance,
      documentsApproved,
    };
  }

  return {
    phase: "awaiting_review",
    canUseDashboard: false,
    redirectTo: "/seller/verification",
    compliance,
    documentsApproved,
  };
}

export function sellerApprovalBlockReason(
  seller: SellerProfile,
  documents: SellerDocument[],
): string | null {
  const access = evaluateSellerAccess(seller, documents);
  if (access.phase === "approved") return "Seller is already approved.";

  if (!access.compliance.isComplete) {
    return "Upload all required documents before approving this seller.";
  }

  if (!access.documentsApproved) {
    return "Approve each required document before approving this seller.";
  }

  return null;
}
