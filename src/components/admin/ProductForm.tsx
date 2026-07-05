"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BtnPrimary } from "@/components/admin/ui";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
import { ProductEnrichmentEditor } from "@/components/admin/ProductEnrichmentEditor";
import { ProductSupplierPanel } from "@/components/admin/ProductSupplierPanel";
import { ProductFormDetailsSection } from "@/components/admin/ProductFormDetailsSection";
import { ProductFormPricingSection } from "@/components/admin/ProductFormPricingSection";
import {
  StorefrontSectionToggles,
  flagsFromProduct,
} from "@/components/admin/StorefrontSectionToggles";
import { getStockStatusOrigin } from "@/config/product-stock";
import { SA_WAREHOUSE_DELIVERY_DAYS } from "@/config/delivery";
import type { ProductVariantsConfig } from "@/types/product-variants";
import { emptyVariantsConfig } from "@/types/product-variants";
import type { ProductEnrichment } from "@/types/product-enrichment";
import { emptyEnrichment, buildProductMetadata } from "@/types/product-enrichment";

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
  source_url: string;
  delivery_days_min: number;
  delivery_days_max: number;
  is_featured: boolean;
  is_deal: boolean;
  show_in_hot?: boolean;
  show_in_steals?: boolean;
  show_in_fresh_drops?: boolean;
  variants?: ProductVariantsConfig;
  enrichment?: ProductEnrichment;
}

export function ProductForm({
  defaultMarkup = 10,
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
    source_url: product?.source_url ?? "",
    delivery_days_min: product ? String(product.delivery_days_min) : String(SA_WAREHOUSE_DELIVERY_DAYS.min),
    delivery_days_max: product ? String(product.delivery_days_max) : String(SA_WAREHOUSE_DELIVERY_DAYS.max),
    is_featured: product?.is_featured ?? false,
    is_deal: product?.is_deal ?? false,
  });
  const [sections, setSections] = useState(
    flagsFromProduct({
      show_in_hot: product?.show_in_hot ?? product?.is_featured ?? false,
      show_in_steals: product?.show_in_steals ?? product?.is_deal ?? false,
      show_in_fresh_drops: product?.show_in_fresh_drops ?? false,
    }),
  );
  const [variants, setVariants] = useState<ProductVariantsConfig>(
    product?.variants ?? emptyVariantsConfig(),
  );
  const [enrichment, setEnrichment] = useState<ProductEnrichment>(
    product?.enrichment ?? emptyEnrichment(),
  );

  function update(key: string, value: string | boolean) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && typeof value === "string") {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
      if (key === "stock_status" && typeof value === "string") {
        next.stock_origin = getStockStatusOrigin(value);
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
        source_url: form.source_url || null,
        ...sections,
        metadata: {
          ...buildProductMetadata({
            variants: variants.options.length > 0 ? variants : null,
            highlights: enrichment.highlights,
            specifications: enrichment.specifications,
            summary: enrichment.summary,
            sourcing: enrichment.sourcing,
            supplierIntel: enrichment.supplierIntel,
          }),
          quantity: Number(form.quantity),
          stock_origin: form.stock_origin,
        },
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
                source_url: payload.source_url,
                delivery_days_min: payload.delivery_days_min,
                delivery_days_max: payload.delivery_days_max,
                is_featured: payload.is_featured,
                is_deal: payload.is_deal,
                show_in_hot: sections.show_in_hot,
                show_in_steals: sections.show_in_steals,
                show_in_fresh_drops: sections.show_in_fresh_drops,
                metadata: payload.metadata,
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
      <ProductFormDetailsSection form={form} update={update} />

      <ProductSupplierPanel
        sourceName={form.source_name}
        sourceUrl={form.source_url}
        basePrice={form.base_price ? Number(form.base_price) : undefined}
        supplierIntel={enrichment.supplierIntel}
      />

      <ProductFormPricingSection form={form} update={update} />

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-950">Storefront sections</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Choose which homepage rows show this product. Categories are separate — this only controls Hot right now, Today&apos;s steals, and Fresh drops.
        </p>
        <div className="mt-4">
          <StorefrontSectionToggles value={sections} onChange={setSections} />
        </div>
      </div>

      <ProductEnrichmentEditor value={enrichment} onChange={setEnrichment} />
      <ProductVariantsEditor value={variants} onChange={setVariants} />

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
