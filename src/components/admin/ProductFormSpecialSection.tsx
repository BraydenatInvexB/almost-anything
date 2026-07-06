import { ProductFormField as Field } from "@/components/admin/ProductFormField";
import { formatCurrency } from "@/lib/utils/cn";
import { computeDealDiscountPercent } from "@/lib/product/product-special-pricing";

export type SpecialFormSlice = {
  special_enabled: boolean;
  compare_at_price: string;
  sale_price: string;
};

export function ProductFormSpecialSection({
  form,
  update,
  currency = "ZAR",
}: {
  form: SpecialFormSlice;
  update: (key: keyof SpecialFormSlice, value: string | boolean) => void;
  currency?: string;
}) {
  const compareAt = Number(form.compare_at_price);
  const sale = Number(form.sale_price);
  const discount =
    form.special_enabled && compareAt > 0 && sale > 0
      ? computeDealDiscountPercent(compareAt, sale)
      : null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">Special offer</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Show a was/now price on the storefront — e.g. was R999, now R499.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-800">
          <input
            type="checkbox"
            checked={form.special_enabled}
            onChange={(e) => update("special_enabled", e.target.checked)}
          />
          Show special
        </label>
      </div>

      {form.special_enabled ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Was price" hint="Original price shoppers see crossed out.">
            <input
              type="number"
              min={0}
              step="0.01"
              className="input"
              value={form.compare_at_price}
              onChange={(e) => update("compare_at_price", e.target.value)}
              placeholder="999"
              required={form.special_enabled}
            />
          </Field>
          <Field label="Now price" hint="Sale price shown prominently.">
            <input
              type="number"
              min={0}
              step="0.01"
              className="input"
              value={form.sale_price}
              onChange={(e) => update("sale_price", e.target.value)}
              placeholder="499"
              required={form.special_enabled}
            />
          </Field>
          {compareAt > 0 && sale > 0 && compareAt > sale ? (
            <p className="sm:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Preview:{" "}
              <span className="text-neutral-500 line-through">
                {formatCurrency(compareAt, currency)}
              </span>{" "}
              <span className="font-bold">{formatCurrency(sale, currency)}</span>
              {discount ? ` · ${discount}% off` : null}
            </p>
          ) : compareAt > 0 && sale > 0 && compareAt <= sale ? (
            <p className="sm:col-span-2 text-xs font-medium text-red-600">
              Was price must be higher than the now price.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
