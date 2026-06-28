export interface ProductVariantOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  id: string;
  selections: Record<string, string>;
  sku?: string;
  priceAdjust?: number;
  stock?: number;
  imageUrl?: string;
}

export interface ProductVariantsConfig {
  options: ProductVariantOption[];
  variants: ProductVariant[];
}

export function emptyVariantsConfig(): ProductVariantsConfig {
  return { options: [], variants: [] };
}

export function parseVariantsConfig(metadata: unknown): ProductVariantsConfig | null {
  if (!metadata || typeof metadata !== "object") return null;
  const raw = metadata as { variants?: ProductVariantsConfig };
  if (!raw.variants?.options?.length || !raw.variants?.variants?.length) return null;
  return raw.variants;
}

export function variantLabel(variant: ProductVariant): string {
  return Object.values(variant.selections).join(" · ");
}

export function findVariant(
  config: ProductVariantsConfig,
  selections: Record<string, string>,
): ProductVariant | null {
  return (
    config.variants.find((v) =>
      config.options.every((opt) => v.selections[opt.name] === selections[opt.name]),
    ) ?? null
  );
}

export function resolveVariantPrice(basePrice: number, variant: ProductVariant | null): number {
  if (!variant?.priceAdjust) return basePrice;
  return Math.round((basePrice + variant.priceAdjust) * 100) / 100;
}

export function isVariantAvailable(
  variant: ProductVariant | null,
  fallbackInStock: boolean,
): boolean {
  if (!variant) return fallbackInStock;
  if (variant.stock === undefined) return fallbackInStock;
  return variant.stock > 0;
}

export function buildVariantMatrix(options: ProductVariantOption[]): ProductVariant[] {
  if (!options.length || options.some((o) => !o.values.length)) return [];

  function combine(index: number, current: Record<string, string>): ProductVariant[] {
    if (index >= options.length) {
      const id = Object.values(current).join("-").toLowerCase().replace(/\s+/g, "-");
      return [
        {
          id,
          selections: { ...current },
          stock: 10,
          priceAdjust: 0,
        },
      ];
    }

    const opt = options[index];
    return opt.values.flatMap((value) =>
      combine(index + 1, { ...current, [opt.name]: value }),
    );
  }

  return combine(0, {});
}
