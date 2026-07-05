import { ProductImageField } from "@/components/admin/ProductImageField";
import { ProductFormField as Field } from "@/components/admin/ProductFormField";
import { STORE_CATEGORIES } from "@/config/categories";

type FormSlice = {
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url: string;
  source_name: string;
  source_url: string;
};

export function ProductFormDetailsSection({
  form,
  update,
}: {
  form: FormSlice;
  update: (key: string, value: string | boolean) => void;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-950">Product details</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Product name">
          <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </Field>
        <Field label="URL slug">
          <input className="input" value={form.slug} onChange={(e) => update("slug", e.target.value)} required />
        </Field>
        <Field label="Category" className="sm:col-span-2">
          <select className="input" value={form.category} onChange={(e) => update("category", e.target.value)}>
            {STORE_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <textarea
            className="input min-h-[120px] resize-y"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Full product description for the storefront…"
            required
          />
        </Field>
        <ProductImageField
          value={form.image_url}
          onChange={(url) => update("image_url", url)}
        />
        <Field label="Supplier name">
          <input className="input" value={form.source_name} onChange={(e) => update("source_name", e.target.value)} />
        </Field>
        <Field label="Supplier listing URL">
          <input
            className="input"
            type="url"
            value={form.source_url}
            onChange={(e) => update("source_url", e.target.value)}
            placeholder="https://…"
          />
        </Field>
      </div>
    </div>
  );
}
