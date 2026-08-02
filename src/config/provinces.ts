/** South African provinces for driver coverage and delivery routing. */

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
] as const;

export type SaProvince = (typeof SA_PROVINCES)[number];

export function normalizeProvince(value: string | null | undefined): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const hit = SA_PROVINCES.find((p) => p.toLowerCase() === raw.toLowerCase());
  return hit ?? raw;
}
