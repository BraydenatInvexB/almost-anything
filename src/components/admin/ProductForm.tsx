"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BtnPrimary } from "@/components/admin/ui";

interface ProductInput {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  base_price: number;
  markup_percent: number;
  stock_status: string;
  stock_origin: string;
  quantity: number;
  image_url: string;
  source_name: string;
  delivery_days_min: number;
  delivery_days_max: number;
  is_featured: boolean;
  is_deal: boolean;
}

export function ProductForm({
  defaultMarkup = 18,
  product,
}: {
  defaultMarkup?: number;
  product?: ProductInput;
}) {
  const router = useRouter();
  const isEdit = Boolean(product?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "general",
    base_price: product ? String(product.base_price) : "",
    markup_percent: product ? String(product.markup_percent) : String(defaultMarkup),
    stock_status: product?.stock_status ?? "in_stock",
    stock_origin: product?.stock_origin ?? "sa_warehouse",
    quantity: product ? String(product.quantity) : "10",
    image_url: product?.image_url ?? "",
    source_name: product?.source_name ?? "",
    delivery_days_min: product ? String(product.delivery_days_min) : "3",
    delivery_days_max: product ? String(product.delivery_days_max) : "7",
    is_featured: product?.is_featured ?? false,
    is_deal: product?.is_deal ?? false,
  });

  function update(key: string, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && typeof value === "string") {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        base_price: Number(form.base_price),
        markup_percent: Number(form.markup_percent),
        quantity: Number(form.quantity),
        delivery_days_min: Number(form.delivery_days_min),
        delivery_days_max: Number(form.delivery_days_max),
        image_url: form.image_url || null,
        source_name: form.source_name || null,
      };

      const res = await fetch("/api/admin/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? {
                id: product!.id,
                name: payload.name,
                slug: payload.slug,
                description: payload.description,
                category: payload.category,
                base_price: payload.base_price,
                markup_percent: payload.markup_percent,
                stock_status: payload.stock_status,
                stock_origin: payload.stock_origin,
                quantity: payload.quantity,
                image_url: payload.image_url,
                source_name: payload.source_name,
                delivery_days_min: payload.delivery_days_min,
                delivery_days_max: payload.delivery_days_max,
                is_featured: payload.is_featured,
                is_deal: payload.is_deal,
                retail_price: Number(
                  (payload.base_price * (1 + payload.markup_percent / 100)).toFixed(2),
                ),
              }
            : payload,
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create product");
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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
            <select className="input capitalize" value={form.category} onChange={(e) => update("category", e.target.value)}>
              {["general", "electronics", "furniture", "home", "fashion", "kitchen", "gaming"].map((c) => (
                <option key={c} value={c}>{c}</option>
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
          <Field label="Image URL">
            <input className="input" value={form.image_url} onChange={(e) => update("image_url", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Supplier name">
            <input className="input" value={form.source_name} onChange={(e) => update("source_name", e.target.value)} />
          </Field>
        </div>
      </div>

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
          <Field label="Stock status">
            <select className="input" value={form.stock_status} onChange={(e) => update("stock_status", e.target.value)}>
              <option value="in_stock">In stock (SA warehouse)</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="sourced">Sourced on order</option>
            </select>
          </Field>
          <Field label="Stock origin">
            <select className="input" value={form.stock_origin} onChange={(e) => update("stock_origin", e.target.value)}>
              <option value="sa_warehouse">South Africa warehouse</option>
              <option value="overseas">Overseas supplier</option>
            </select>
          </Field>
          <Field label="Delivery days">
            <div className="flex gap-2">
              <input type="number" className="input" value={form.delivery_days_min} onChange={(e) => update("delivery_days_min", e.target.value)} />
              <input type="number" className="input" value={form.delivery_days_max} onChange={(e) => update("delivery_days_max", e.target.value)} />
            </div>
          </Field>
        </div>
        <div className="mt-4 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_deal} onChange={(e) => update("is_deal", e.target.checked)} />
            Deal product
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="h-9 rounded-lg border border-neutral-200 px-4 text-sm font-semibold">
          Cancel
        </button>
        <BtnPrimary type="submit" disabled={saving}>
          {saving ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create product"}
        </BtnPrimary>
      </div>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
