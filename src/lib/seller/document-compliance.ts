import {
  getDocumentLabel,
  getRequiredDocuments,
  normalizeDocumentType,
  type SellerDocumentType,
} from "@/config/seller-document-requirements";
import type { SellerEntityType } from "@/config/seller-entity-types";
import type { SellerDocument } from "@/types/seller";

const VALID_TYPES = new Set<SellerDocumentType>([
  "owner_id",
  "proof_of_address",
  "company_registration",
  "vat_certificate",
  "bank_confirmation",
  "partnership_agreement",
  "trust_deed",
  "npo_registration",
  "other",
]);

export interface SellerDocumentCompliance {
  requiredCount: number;
  uploadedRequiredCount: number;
  missingRequired: SellerDocumentType[];
  isComplete: boolean;
  completionPercent: number;
}

export function groupDocumentsByType(
  documents: SellerDocument[],
): Partial<Record<SellerDocumentType, SellerDocument[]>> {
  const grouped: Partial<Record<SellerDocumentType, SellerDocument[]>> = {};

  for (const doc of documents) {
    const type = normalizeDocumentType(doc.docType);
    grouped[type] = [...(grouped[type] ?? []), { ...doc, docType: type }];
  }

  return grouped;
}

export function evaluateSellerDocumentCompliance(
  entityType: SellerEntityType,
  documents: SellerDocument[],
): SellerDocumentCompliance {
  const grouped = groupDocumentsByType(documents);
  const required = getRequiredDocuments(entityType);
  const missingRequired = required
    .filter((spec) => !(grouped[spec.id]?.length ?? 0))
    .map((spec) => spec.id);

  const uploadedRequiredCount = required.length - missingRequired.length;

  return {
    requiredCount: required.length,
    uploadedRequiredCount,
    missingRequired,
    isComplete: missingRequired.length === 0,
    completionPercent:
      required.length === 0
        ? 100
        : Math.round((uploadedRequiredCount / required.length) * 100),
  };
}

export function formatMissingDocuments(missing: SellerDocumentType[]): string {
  return missing.map((type) => getDocumentLabel(type)).join(", ");
}

export function evaluateRequiredDocumentsApproved(
  entityType: SellerEntityType,
  documents: SellerDocument[],
): { isApproved: boolean; pendingRequired: SellerDocumentType[] } {
  const grouped = groupDocumentsByType(documents);
  const required = getRequiredDocuments(entityType);
  const pendingRequired = required
    .filter((spec) => !(grouped[spec.id] ?? []).some((doc) => doc.status === "approved"))
    .map((spec) => spec.id);

  return {
    isApproved: pendingRequired.length === 0,
    pendingRequired,
  };
}

export function parseDocumentType(value: string): SellerDocumentType {
  const normalized = normalizeDocumentType(value);
  if (!VALID_TYPES.has(normalized)) {
    throw new Error("Unsupported document type.");
  }
  return normalized;
}
