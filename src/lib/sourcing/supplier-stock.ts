import type { SupplierRegion } from "@/types/supplier-sourcing";
import type { ProductStockStatus } from "@/config/product-stock";

export function stockStatusFromSupplierRegion(
  region?: SupplierRegion,
): ProductStockStatus {
  return region === "south_africa" ? "in_stock" : "available_international";
}

export function stockOriginFromSupplierRegion(
  region?: SupplierRegion,
): "sa_warehouse" | "overseas" {
  return region === "south_africa" ? "sa_warehouse" : "overseas";
}
