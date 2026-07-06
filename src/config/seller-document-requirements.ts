import type { SellerEntityType } from "@/config/seller-entity-types";

export type SellerDocumentType =
  | "owner_id"
  | "proof_of_address"
  | "company_registration"
  | "vat_certificate"
  | "bank_confirmation"
  | "partnership_agreement"
  | "trust_deed"
  | "npo_registration"
  | "other";

export type SellerDocumentCategory = "identity" | "address" | "business" | "financial" | "other";

export interface SellerDocumentRequirement {
  id: SellerDocumentType;
  label: string;
  description: string;
  category: SellerDocumentCategory;
  /** When set, only required for these entity types. When empty, required for all. */
  requiredForEntities?: SellerEntityType[];
  /** Always shown but never required (e.g. VAT when not registered). */
  optional?: boolean;
}

export const SELLER_DOCUMENT_REQUIREMENTS: SellerDocumentRequirement[] = [
  {
    id: "owner_id",
    label: "Owner / director ID",
    description: "Clear copy of SA ID card (both sides) or valid passport of the business owner or main director.",
    category: "identity",
  },
  {
    id: "proof_of_address",
    label: "Proof of address",
    description: "Utility bill, bank statement, or municipal account dated within the last 3 months.",
    category: "address",
  },
  {
    id: "bank_confirmation",
    label: "Proof of banking",
    description: "Bank confirmation letter or stamped bank statement showing business or trading account details.",
    category: "financial",
  },
  {
    id: "company_registration",
    label: "Company registration (CIPC)",
    description: "CIPC registration certificate or official company extract.",
    category: "business",
    requiredForEntities: [
      "private_company",
      "public_company",
      "close_corporation",
      "partnership",
      "other",
    ],
  },
  {
    id: "partnership_agreement",
    label: "Partnership agreement",
    description: "Signed partnership agreement listing all partners.",
    category: "business",
    requiredForEntities: ["partnership"],
  },
  {
    id: "trust_deed",
    label: "Trust deed",
    description: "Registered trust deed and authorisation for the trading entity.",
    category: "business",
    requiredForEntities: ["trust"],
  },
  {
    id: "npo_registration",
    label: "NPO / NGO registration",
    description: "NPO certificate or relevant registration from the Department of Social Development.",
    category: "business",
    requiredForEntities: ["npo"],
  },
  {
    id: "vat_certificate",
    label: "VAT certificate",
    description: "SARS VAT registration certificate — upload if your business is VAT registered.",
    category: "financial",
    optional: true,
  },
  {
    id: "other",
    label: "Additional supporting document",
    description: "Any other document requested by our verification team.",
    category: "other",
    optional: true,
  },
];

export function getApplicableDocuments(entityType: SellerEntityType): SellerDocumentRequirement[] {
  return SELLER_DOCUMENT_REQUIREMENTS.filter((doc) => {
    if (doc.optional) return true;
    if (!doc.requiredForEntities) return true;
    return doc.requiredForEntities.includes(entityType);
  });
}

export function isDocumentRequired(
  docType: SellerDocumentType,
  entityType: SellerEntityType,
): boolean {
  const spec = SELLER_DOCUMENT_REQUIREMENTS.find((doc) => doc.id === docType);
  if (!spec || spec.optional) return false;
  if (!spec.requiredForEntities) return true;
  return spec.requiredForEntities.includes(entityType);
}

export function getRequiredDocuments(entityType: SellerEntityType): SellerDocumentRequirement[] {
  return getApplicableDocuments(entityType).filter((doc) => isDocumentRequired(doc.id, entityType));
}

export function getDocumentLabel(docType: SellerDocumentType): string {
  return SELLER_DOCUMENT_REQUIREMENTS.find((doc) => doc.id === docType)?.label ?? docType;
}

export const SELLER_DOCUMENT_TYPE_IDS = SELLER_DOCUMENT_REQUIREMENTS.map((doc) => doc.id);

export const LEGACY_DOCUMENT_TYPE_MAP: Record<string, SellerDocumentType> = {
  registration: "company_registration",
  vat: "vat_certificate",
  bank: "bank_confirmation",
  id: "owner_id",
};

export function normalizeDocumentType(value: string): SellerDocumentType {
  return (LEGACY_DOCUMENT_TYPE_MAP[value] ?? value) as SellerDocumentType;
}

export function getCategoryLabel(category: SellerDocumentCategory): string {
  const labels: Record<SellerDocumentCategory, string> = {
    identity: "Identity",
    address: "Address",
    business: "Business registration",
    financial: "Banking & tax",
    other: "Other",
  };
  return labels[category];
}

export const SELLER_DOCUMENT_CATEGORIES: SellerDocumentCategory[] = [
  "identity",
  "address",
  "business",
  "financial",
  "other",
];

export function documentsByCategory(
  entityType: SellerEntityType,
): Record<SellerDocumentCategory, SellerDocumentRequirement[]> {
  const grouped = Object.fromEntries(
    SELLER_DOCUMENT_CATEGORIES.map((category) => [category, [] as SellerDocumentRequirement[]]),
  ) as Record<SellerDocumentCategory, SellerDocumentRequirement[]>;

  for (const doc of getApplicableDocuments(entityType)) {
    grouped[doc.category].push(doc);
  }

  return grouped;
}
