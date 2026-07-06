export type SellerEntityType =
  | "sole_proprietor"
  | "partnership"
  | "private_company"
  | "public_company"
  | "close_corporation"
  | "trust"
  | "npo"
  | "other";

export interface SellerEntityOption {
  id: SellerEntityType;
  label: string;
  description: string;
}

export const SELLER_ENTITY_TYPES: SellerEntityOption[] = [
  {
    id: "sole_proprietor",
    label: "Sole Proprietor",
    description: "Individual trading in your own name.",
  },
  {
    id: "partnership",
    label: "Partnership",
    description: "Two or more partners running the business together.",
  },
  {
    id: "private_company",
    label: "Private Company (Pty Ltd)",
    description: "Registered private company with CIPC.",
  },
  {
    id: "public_company",
    label: "Public Company (Ltd)",
    description: "Listed or unlisted public company.",
  },
  {
    id: "close_corporation",
    label: "Close Corporation (CC)",
    description: "Legacy CC registration (pre-2011 conversions).",
  },
  {
    id: "trust",
    label: "Trust",
    description: "Business operated through a registered trust.",
  },
  {
    id: "npo",
    label: "Non-Profit / NGO",
    description: "Registered non-profit or community organisation.",
  },
  {
    id: "other",
    label: "Other",
    description: "Another legal entity type not listed above.",
  },
];

export const SELLER_ENTITY_BY_ID = Object.fromEntries(
  SELLER_ENTITY_TYPES.map((option) => [option.id, option]),
) as Record<SellerEntityType, SellerEntityOption>;

export function getSellerEntityLabel(entityType: SellerEntityType): string {
  return SELLER_ENTITY_BY_ID[entityType]?.label ?? entityType;
}

export const SELLER_ENTITY_TYPE_IDS = SELLER_ENTITY_TYPES.map((option) => option.id);
