import type { ShippingAddress } from "@/types/cart";

export interface CustomerAddress {
  id: string;
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CustomerAddressInput = Omit<
  CustomerAddress,
  "id" | "isDefault" | "createdAt" | "updatedAt"
> & { isDefault?: boolean };

export function addressFingerprint(input: {
  addressLine1: string;
  postalCode: string;
  city: string;
  country: string;
}): string {
  return [input.addressLine1, input.postalCode, input.city, input.country]
    .map((part) => part.trim().toLowerCase())
    .join("|");
}

export function toShippingAddress(
  address: CustomerAddress,
  email: string,
): ShippingAddress {
  return {
    fullName: address.fullName,
    email,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
  };
}

export function fromShippingAddress(
  address: ShippingAddress,
  label?: string,
): CustomerAddressInput {
  return {
    label,
    fullName: address.fullName.trim(),
    phone: address.phone.trim(),
    addressLine1: address.addressLine1.trim(),
    addressLine2: address.addressLine2?.trim() || undefined,
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.postalCode.trim(),
    country: address.country.trim() || "ZA",
  };
}

export function mapAddressRow(row: Record<string, unknown>): CustomerAddress {
  return {
    id: String(row.id),
    label: row.label ? String(row.label) : undefined,
    fullName: String(row.full_name),
    phone: String(row.phone),
    addressLine1: String(row.address_line1),
    addressLine2: row.address_line2 ? String(row.address_line2) : undefined,
    city: String(row.city),
    state: String(row.state),
    postalCode: String(row.postal_code),
    country: String(row.country),
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
