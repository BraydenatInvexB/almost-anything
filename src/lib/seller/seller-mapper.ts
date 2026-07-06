import {
  normalizeDocumentType,
} from "@/config/seller-document-requirements";
import type {
  SellerApplicationInput,
  SellerDocument,
  SellerPayout,
  SellerProfile,
  SellerTeamMember,
} from "@/types/seller";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function buildSellerSlug(shopName: string): string {
  return `${slugify(shopName)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function mapSellerRow(
  row: Record<string, unknown>,
  role = "owner",
  permissions: string[] = [],
): SellerProfile {
  const address = (row.business_address ?? {}) as Record<string, string>;
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : undefined,
    shopName: String(row.shop_name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : undefined,
    logoUrl: row.logo_url ? String(row.logo_url) : undefined,
    companyName: String(row.company_name),
    entityType: (row.entity_type as SellerProfile["entityType"]) ?? "private_company",
    registrationNumber: row.registration_number ? String(row.registration_number) : undefined,
    vatNumber: row.vat_number ? String(row.vat_number) : undefined,
    contactEmail: String(row.contact_email),
    contactPhone: String(row.contact_phone),
    businessAddress: {
      line1: address.line1 ?? "",
      line2: address.line2,
      city: address.city ?? "",
      state: address.state ?? "",
      postalCode: address.postalCode ?? address.postal_code ?? "",
      country: address.country ?? "ZA",
    },
    categorySlugs: Array.isArray(row.category_slugs) ? row.category_slugs.map(String) : [],
    sellsAllCategories: Boolean(row.sells_all_categories),
    status: row.status as SellerProfile["status"],
    plan: row.plan as SellerProfile["plan"],
    subscriptionStatus: row.subscription_status as SellerProfile["subscriptionStatus"],
    subscriptionStartsAt: row.subscription_starts_at ? String(row.subscription_starts_at) : undefined,
    firstSaleAt: row.first_sale_at ? String(row.first_sale_at) : undefined,
    preferredCouriers: Array.isArray(row.preferred_couriers)
      ? row.preferred_couriers.map(String)
      : [],
    defaultStockOrigin:
      row.default_stock_origin === "overseas" ? "overseas" : "sa_warehouse",
    role: role as SellerProfile["role"],
    permissions,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function mapSellerDocument(row: Record<string, unknown>): SellerDocument {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    docType: normalizeDocumentType(String(row.doc_type)),
    fileName: String(row.file_name),
    fileUrl: String(row.file_url),
    status: row.status as SellerDocument["status"],
    notes: row.notes ? String(row.notes) : undefined,
    uploadedAt: String(row.uploaded_at),
  };
}

export function mapSellerTeamMember(row: Record<string, unknown>): SellerTeamMember {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    userId: row.user_id ? String(row.user_id) : undefined,
    email: String(row.email),
    fullName: String(row.full_name),
    role: row.role as SellerTeamMember["role"],
    status: row.status as SellerTeamMember["status"],
    permissions: Array.isArray(row.permissions) ? row.permissions.map(String) : [],
    createdAt: String(row.created_at),
  };
}

export function mapSellerPayout(row: Record<string, unknown>): SellerPayout {
  return {
    id: String(row.id),
    sellerId: String(row.seller_id),
    amount: Number(row.amount),
    currency: String(row.currency),
    periodStart: row.period_start ? String(row.period_start) : undefined,
    periodEnd: row.period_end ? String(row.period_end) : undefined,
    status: row.status as SellerPayout["status"],
    notes: row.notes ? String(row.notes) : undefined,
    requestedAt: String(row.requested_at),
    processedAt: row.processed_at ? String(row.processed_at) : undefined,
  };
}

export function applicationToSellerInsert(
  userId: string,
  input: SellerApplicationInput,
) {
  return {
    user_id: userId,
    shop_name: input.shopName.trim(),
    slug: buildSellerSlug(input.shopName),
    description: input.description?.trim() ?? null,
    company_name: input.companyName.trim(),
    entity_type: input.entityType,
    registration_number: input.registrationNumber?.trim() ?? null,
    vat_number: input.vatNumber?.trim() ?? null,
    contact_email: input.contactEmail.trim().toLowerCase(),
    contact_phone: input.contactPhone.trim(),
    business_address: input.businessAddress as unknown as import("@/types/database-primitives").Json,
    category_slugs: input.sellsAllCategories ? [] : input.categorySlugs,
    sells_all_categories: input.sellsAllCategories,
    plan: input.plan,
    status: "pending_review",
    subscription_status: "trial",
  };
}
