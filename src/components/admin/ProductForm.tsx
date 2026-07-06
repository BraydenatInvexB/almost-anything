"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BtnPrimary } from "@/components/admin/ui";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
import { ProductEnrichmentEditor } from "@/components/admin/ProductEnrichmentEditor";
import { ProductSupplierEditor } from "@/components/admin/ProductSupplierEditor";
import {
  bootstrapManualSuppliers,
  parseManualSuppliers,
  syncSourceFromSuppliers,
} from "@/lib/product/product-manual-suppliers";
import type { SupplierListing } from "@/types/supplier-sourcing";
import { ProductFormDetailsSection } from "@/components/admin/ProductFormDetailsSection";
import { ProductFormPricingSection } from "@/components/admin/ProductFormPricingSection";
import { ProductFormSpecialSection } from "@/components/admin/ProductFormSpecialSection";
import {
  StorefrontSectionToggles,
  flagsFromProduct,
} from "@/components/admin/StorefrontSectionToggles";
import { getStockStatusOrigin } from "@/config/product-stock";
import { SA_WAREHOUSE_DELIVERY_DAYS } from "@/config/delivery";
import { emptyVariantsConfig, type ProductVariantsConfig } from "@/types/product-variants";
import { buildProductMetadata, emptyEnrichment, type ProductEnrichment } from "@/types/product-enrichment";
import { parseProductGallery, splitProductGallery } from "@/lib/product/product-gallery";
import {
  computeDealDiscountPercent,
  parseCompareAtPrice,
  resolveRetailWithSpecial,
  specialPricingMetadata,
} from "@/lib/product/product-special-pricing";

interface ProductInput {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  base_price: number;
  retail_price?: number;
  markup_percent: number;
  stock_status: string;
  stock_origin: string;
  quantity: number;
  image_url?: string | null;
  image_urls?: string[];
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
  metadata?: Record<string, unknown>;
}

function initialSpecial(product?: ProductInput) {
  const compareAt = parseCompareAtPrice(product?.metadata);
  const enabled = Boolean(product?.is_deal && compareAt);
  return {
    special_enabled: enabled,
    compare_at_price: compareAt ? String(compareAt) : "",
    sale_price: enabled && product?.retail_price ? String(product.retail_price) : "",
  };
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
    delivery_days_min: product ? String(product.delivery_days_min) : String(SA_WAREHOUSE_DELIVERY_DAYS.min),
    delivery_days_max: product ? String(product.delivery_days_max) : String(SA_WAREHOUSE_DELIVERY_DAYS.max),
    is_featured: product?.is_featured ?? false,
    is_deal: product?.is_deal ?? false,
  });
  const [special, setSpecial] = useState(() => initialSpecial(product));
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.image_urls ??
      parseProductGallery(product?.metadata, product?.image_url),
  );
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
  const [manualSuppliers, setManualSuppliers] = useState<SupplierListing[]>(() =>
    bootstrapManualSuppliers({
      sourceName: product?.source_name,
      sourceUrl: product?.source_url,
      basePrice: product?.base_price,
      existing: product?.enrichment?.manualSuppliers ?? parseManualSuppliers(product?.metadata),
    }),
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

  function updateSpecial(key: keyof typeof special, value: string | boolean) {
    setSpecial((s) => ({ ...s, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const basePrice = Number(form.base_price);
      const markupPercent = Number(form.markup_percent);
      const saleInput = special.special_enabled && special.sale_price
        ? Number(special.sale_price)
        : null;
      const compareAt = special.special_enabled && special.compare_at_price
        ? Number(special.compare_at_price)
        : null;

      if (special.special_enabled && compareAt && saleInput && compareAt <= saleInput) {
        setError("Was price must be higher than the now price.");
        setSaving(false);
        return;
      }

      const retailPrice = resolveRetailWithSpecial({
        basePrice,
        markupPercent,
        specialEnabled: special.special_enabled,
        salePriceInput: saleInput,
      });
      const dealDiscount = special.special_enabled && compareAt && saleInput
        ? computeDealDiscountPercent(compareAt, saleInput)
        : null;

      const sourceFields = syncSourceFromSuppliers(manualSuppliers);
      const { image_url, gallery } = splitProductGallery(imageUrls);
      const payload = {
        ...form,
        base_price: basePrice,
        markup_percent: markupPercent,
        quantity: Number(form.quantity),
        delivery_days_min: Number(form.delivery_days_min),
        delivery_days_max: Number(form.delivery_days_max),
        image_url,
        is_deal: special.special_enabled,
        deal_discount_percent: dealDiscount,
        retail_price: retailPrice,
        source_name: sourceFields.source_name,
        source_url: sourceFields.source_url,
        ...sections,
        metadata: {
          ...buildProductMetadata({
            variants: variants.options.length > 0 ? variants : null,
            highlights: enrichment.highlights,
            specifications: enrichment.specifications,
            summary: enrichment.summary,
            sourcing: enrichment.sourcing,
            supplierIntel: enrichment.supplierIntel,
            manualSuppliers,
          }),
          quantity: Number(form.quantity),
          stock_origin: form.stock_origin,
          gallery,
          suppliersUpdatedAt: manualSuppliers.length ? new Date().toISOString() : undefined,
          ...specialPricingMetadata(special.special_enabled ? compareAt : null),
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
                deal_discount_percent: payload.deal_discount_percent,
                show_in_hot: sections.show_in_hot,
                show_in_steals: sections.show_in_steals,
                show_in_fresh_drops: sections.show_in_fresh_drops,
                metadata: payload.metadata,
                retail_price: payload.retail_price,
              }
            : payload,
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save product");
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
      <ProductFormDetailsSection
        form={{ ...form, image_urls: imageUrls }}
        update={update}
        onImagesChange={setImageUrls}
      />

      <ProductSupplierEditor
        suppliers={manualSuppliers}
        onChange={setManualSuppliers}
        basePrice={form.base_price ? Number(form.base_price) : undefined}
        supplierIntel={enrichment.supplierIntel}
        updatedAt={product?.metadata?.suppliersUpdatedAt as string | undefined}
      />

      <ProductFormPricingSection form={form} update={update} />
      <ProductFormSpecialSection form={special} update={updateSpecial} />

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
