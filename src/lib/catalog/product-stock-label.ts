import type { ProductVariantsConfig } from "@/types/product-variants";
import { parseVariantsConfig } from "@/types/product-variants";

export type StockDisplay = {
  quantity: number;
  label: string;
  variantCount: number;
};

export function stockFromMetadata(metadata: unknown): StockDisplay | null {
  const variants = parseVariantsConfig(metadata);
  if (!variants?.variants.length) {
    const raw = metadata as { quantity?: number } | null;
    if (typeof raw?.quantity === "number" && raw.quantity > 0) {
      return {
        quantity: raw.quantity,
        label: `${raw.quantity} in stock`,
        variantCount: 0,
      };
    }
    return null;
  }

  const variantCount = variants.variants.length;
  const quantity = variants.variants.reduce((sum, v) => sum + (v.stock ?? 10), 0);
  const colourCount = variants.options.find((o) =>
    /colou?r/i.test(o.name),
  )?.values.length;
  const sizeCount = variants.options.find((o) => /size/i.test(o.name))?.values.length;

  let label = `${quantity} in stock`;
  if (colourCount && sizeCount) {
    label = `${quantity} in stock · ${colourCount} colours · ${sizeCount} sizes`;
  } else if (colourCount && colourCount > 1) {
    label = `${quantity} in stock · ${colourCount} colours`;
  } else if (sizeCount && sizeCount > 1) {
    label = `${quantity} in stock · ${sizeCount} sizes`;
  } else if (variantCount > 1) {
    label = `${quantity} in stock · ${variantCount} options`;
  }

  return { quantity, label, variantCount };
}

export function ensureVariantStock(config: ProductVariantsConfig): ProductVariantsConfig {
  return {
    ...config,
    variants: config.variants.map((v) => ({
      ...v,
      stock: v.stock ?? 10,
    })),
  };
}
