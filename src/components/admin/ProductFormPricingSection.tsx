import { ProductFormField as Field } from "@/components/admin/ProductFormField";
import { STOCK_STATUS_OPTIONS } from "@/config/product-stock";

type FormSlice = {
  base_price: string;
  markup_percent: string;
  quantity: string;
  stock_status: string;
  stock_origin: string;
  delivery_days_min: string;
  delivery_days_max: string;
  is_featured: boolean;
  is_deal: boolean;
};

export function ProductFormPricingSection({
  form,
  update,
}: {
  form: FormSlice;
  update: (key: string, value: string | boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-950">Pricing & inventory</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Cost price (ZAR)">
          <input type="number" className="input" value={form.base_price} onChange={(e) => update("base_price", e.target.value)} required />
        </Field>
        <Field label="Markup %">
          <input type="number" className="input" value={form.markup_percent} onChange={(e) => update("markup_percent", e.target.value)} />
        </Field>
        <Field label="Quantity">
          <input type="number" className="input" value={form.quantity} onChange={(e) => update("quantity", e.target.value)} />
        </Field>
        <Field label="Stock status" hint="Sets availability and whether the item ships from SA or internationally.">
          <select
            className="input"
            value={form.stock_status}
            onChange={(e) => update("stock_status", e.target.value)}
          >
            {STOCK_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-400">
            {STOCK_STATUS_OPTIONS.find((o) => o.value === form.stock_status)?.description}
          </p>
        </Field>
        <Field label="Stock origin" hint="Auto-set from stock status — override if needed.">
          <select className="input" value={form.stock_origin} onChange={(e) => update("stock_origin", e.target.value)}>
            <option value="sa_warehouse">South Africa warehouse</option>
            <option value="overseas">Overseas / international supplier</option>
          </select>
        </Field>
        <Field label="Delivery days">
          <div className="flex gap-2">
            <input type="number" className="input" value={form.delivery_days_min} onChange={(e) => update("delivery_days_min", e.target.value)} />
            <input type="number" className="input" value={form.delivery_days_max} onChange={(e) => update("delivery_days_max", e.target.value)} />
          </div>
        </Field>
      </div>
      <div className="mt-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} />
          Featured badge
        </label>
      </div>
    </div>
  );
}
