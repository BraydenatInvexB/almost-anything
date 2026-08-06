import type { DeliveryCollectionStop } from "@/lib/delivery/types";

export function formatAddress(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

export function formatCollectionAddress(stop: DeliveryCollectionStop): string {
  return formatAddress([
    stop.addressLine1,
    stop.addressLine2,
    stop.city,
    stop.province,
    stop.postalCode,
    stop.country,
  ]);
}

export function googleMapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function googleMapsDirectionsUrl(addresses: string[]): string | null {
  const usable = addresses.map((address) => address.trim()).filter(Boolean);
  if (!usable.length) return null;
  if (usable.length === 1) return googleMapsSearchUrl(usable[0]);
  const origin = usable[0];
  const destination = usable[usable.length - 1];
  const waypoints = usable.slice(1, -1);
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });
  if (waypoints.length) params.set("waypoints", waypoints.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
