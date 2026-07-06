import { formatCurrency } from "@/lib/utils/cn";

interface ProductPriceDisplayProps {
  price: number;
  currency: string;
  compareAtPrice?: number | null;
  size?: "card" | "detail";
  unitLabel?: string;
}

export function ProductPriceDisplay({
  price,
  currency,
  compareAtPrice,
  size = "detail",
  unitLabel,
}: ProductPriceDisplayProps) {
  const showWas = compareAtPrice != null && compareAtPrice > price;

  if (size === "card") {
    return (
      <div className="min-w-0">
        {showWas ? (
          <p className="text-[11px] text-neutral-400 line-through">
            {formatCurrency(compareAtPrice, currency)}
          </p>
        ) : null}
        <p className="text-base font-bold tabular-nums text-neutral-900 sm:text-lg">
          {formatCurrency(price, currency)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <p className="text-4xl font-bold text-neutral-900">
        {formatCurrency(price, currency)}
      </p>
      {unitLabel ? (
        <span className="text-sm font-medium text-neutral-500">per {unitLabel}</span>
      ) : null}
      {showWas ? (
        <p className="text-lg text-neutral-400 line-through">
          {formatCurrency(compareAtPrice, currency)}
        </p>
      ) : null}
    </div>
  );
}
