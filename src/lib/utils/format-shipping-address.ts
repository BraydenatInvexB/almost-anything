import type { ShippingAddress } from "@/types/cart";

type StoredAddress = ShippingAddress & {
  line1?: string;
  line2?: string;
  province?: string;
};

/** Formats a shipping address for display (handles checkout + admin field names). */
export function formatOrderShippingAddress(address: ShippingAddress): string[] {
  const a = address as StoredAddress;
  const line1 = a.addressLine1 || a.line1;
  const line2 = a.addressLine2 || a.line2;
  const region = a.state || a.province;
  const cityLine = [a.city, region, a.postalCode].filter(Boolean).join(", ");

  return [line1, line2, cityLine].filter(Boolean) as string[];
}
