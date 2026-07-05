export function compactStockLabel(status: string): string {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "available_international":
      return "Intl.";
    case "low_stock":
      return "Low";
    case "out_of_stock":
      return "Out";
    case "sourced":
      return "Sourced";
    default:
      return status.replace(/_/g, " ");
  }
}

export type ProductsManagerSaveState = "idle" | "saving" | "saved";
export type ProductsManagerDeleteState = "idle" | "deleting";
