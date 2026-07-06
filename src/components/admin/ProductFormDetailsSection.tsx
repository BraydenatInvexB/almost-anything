import { ProductImageField } from "@/components/admin/ProductImageField";
import { ProductFormField as Field } from "@/components/admin/ProductFormField";
import { STORE_CATEGORIES } from "@/config/categories";

type FormSlice = {
  name: string;
  slug: string;
  category: string;
  description: string;
  image_urls: string[];
};

export function ProductFormDetailsSection({
  form,
  update,
  onImagesChange,
}: {
  form: FormSlice;
  update: (key: keyof Omit<FormSlice, "image_urls">, value: string | boolean) => void;
  onImagesChange: (urls: string[]) => void;
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
        <ProductImageField value={form.image_urls} onChange={onImagesChange} />
      </div>
    </div>
  );
}
