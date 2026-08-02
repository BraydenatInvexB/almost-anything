"use client";

import { useState } from "react";
import { ProductImageField } from "@/components/admin/ProductImageField";
import { ProductFormField } from "@/components/admin/ProductFormField";
import { ProductEnrichmentEditor } from "@/components/admin/ProductEnrichmentEditor";
import { ProductVariantsEditor } from "@/components/admin/ProductVariantsEditor";
import { ProductFormSpecialSection } from "@/components/admin/ProductFormSpecialSection";
import { BtnPrimary, BtnSecondary } from "@/components/admin/ui";
import { SA_WAREHOUSE_DELIVERY_DAYS } from "@/config/delivery";
import { STORE_CATEGORIES } from "@/config/categories";
import {
  listingIntentLabel,
  listingSuccessMessage,
  type SellerSaveIntent,
} from "@/lib/seller/listing-status";
import { normalizeListingStatus } from "@/config/seller-listing-status";
import {
  catalogProductImageUrls,
  catalogProductStockOrigin,
} from "@/lib/seller/catalog-product";
import { parseSellerProductCatalogExtras } from "@/lib/seller/product-metadata";
import { parseSellerDelivery, retailFromCost } from "@/lib/seller/product-pricing";
import { parseSellerSupplier, type SellerSupplierInfo } from "@/lib/seller/product-supplier";
import { SellerPricingFields } from "@/components/seller/SellerPricingFields";
import { SellerStockOriginField } from "@/components/seller/SellerStockOriginField";
import { SellerSupplierFields } from "@/components/seller/SellerSupplierFields";
import { emptyEnrichment, type ProductEnrichment } from "@/types/product-enrichment";
import {
  emptyVariantsConfig,
  type ProductVariantsConfig,
} from "@/types/product-variants";
import type { StockOrigin } from "@/lib/admin/operations-inventory-types";
import type {
  SellerCatalogProduct,
  SellerCatalogShipping,
  SellerDeliverySettings,
} from "@/types/seller-catalog";

type EditorMode = "create" | "edit";

export function SellerProductEditor({
  mode,
  product,
  shipping,
  sellerApproved,
  defaultStockOrigin,
  onSaved,
  onCancel,
}: {
  mode: EditorMode;
  product?: SellerCatalogProduct | null;
  shipping: SellerCatalogShipping;
  sellerApproved: boolean;
  defaultStockOrigin: StockOrigin;
  onSaved: (product: SellerCatalogProduct) => void;
  onCancel?: () => void;
}) {
  const extras = product
    ? parseSellerProductCatalogExtras(
        product.metadata,
        Number(product.retail_price) || 0,
        Boolean(product.is_deal),
      )
    : null;

  const [images, setImages] = useState<string[]>(() =>
    product ? catalogProductImageUrls(product) : [],
  );
  const [name, setName] = useState(product?.name ?? "");
  const [costPrice, setCostPrice] = useState(
    product ? String(Number(product.base_price) || "") : "",
  );
  const [markupPercent, setMarkupPercent] = useState(
    product
      ? String(Number(product.markup_percent) || shipping.defaultMarkupPercent)
      : String(shipping.defaultMarkupPercent),
  );
  const [quantity, setQuantity] = useState(
    product ? String(Number(product.stock_quantity) || 0) : "",
  );
  const [category, setCategory] = useState(
    product?.category ?? STORE_CATEGORIES[0]?.slug ?? "general",
  );
  const [description, setDescription] = useState(product?.description ?? "");
  const [deliveryDaysMin, setDeliveryDaysMin] = useState(
    String(Number(product?.delivery_days_min) || SA_WAREHOUSE_DELIVERY_DAYS.min),
  );
  const [deliveryDaysMax, setDeliveryDaysMax] = useState(
    String(Number(product?.delivery_days_max) || SA_WAREHOUSE_DELIVERY_DAYS.max),
  );
  const [delivery, setDelivery] = useState<SellerDeliverySettings>(() =>
    product
      ? parseSellerDelivery(product.metadata)
      : { customerPaysDelivery: true, deliveryFeeZar: null },
  );
  const [stockOrigin, setStockOrigin] = useState<StockOrigin>(() =>
    product ? catalogProductStockOrigin(product, defaultStockOrigin) : defaultStockOrigin,
  );
  const [supplier, setSupplier] = useState<SellerSupplierInfo>(() =>
    product ? parseSellerSupplier(product.metadata) : { tracked: false },
  );
  const [variants, setVariants] = useState<ProductVariantsConfig>(
    () => extras?.variants ?? emptyVariantsConfig(),
  );
  const [enrichment, setEnrichment] = useState<ProductEnrichment>(
    () => extras?.enrichment ?? emptyEnrichment(),
  );
  const [special, setSpecial] = useState({
    special_enabled: extras?.special.enabled ?? false,
    compare_at_price:
      extras?.special.compareAtPrice != null ? String(extras.special.compareAtPrice) : "",
    sale_price: extras?.special.salePrice != null ? String(extras.special.salePrice) : "",
  });
  const [loading, setLoading] = useState<SellerSaveIntent | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(saveIntent: SellerSaveIntent) {
    setLoading(saveIntent);
    setMessage("");
    setError("");
    const cost = Number(costPrice) || 0;
    const markup = Number(markupPercent) || 0;
    const retail = cost > 0 ? retailFromCost(cost, markup) : 0;
    const specialEnabled = special.special_enabled;
    const compareAt = specialEnabled && special.compare_at_price
      ? Number(special.compare_at_price)
      : null;
    const salePrice = specialEnabled && special.sale_price ? Number(special.sale_price) : null;

    if (specialEnabled && compareAt && salePrice && compareAt <= salePrice) {
      setError("Was price must be higher than the now price.");
      setLoading(null);
      return;
    }

    const payload = {
      name,
      costPrice: cost,
      markupPercent: markup,
      retailPrice: retail,
      stockQuantity: Number(quantity) || 0,
      category,
      imageUrls: images,
      description: description || undefined,
      deliveryDaysMin: Number(deliveryDaysMin),
      deliveryDaysMax: Number(deliveryDaysMax),
      delivery,
      saveIntent,
      stockOrigin,
      supplier,
      variants,
      enrichment,
      special: {
        enabled: specialEnabled,
        compareAtPrice: compareAt,
        salePrice,
      },
    };

    try {
      const res = await fetch("/api/seller/products", {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "edit" && product ? { id: product.id, product: payload } : payload,
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save product");

      setMessage(listingSuccessMessage(normalizeListingStatus(data.product.listing_status)));
      onSaved(data.product as SellerCatalogProduct);
      if (mode === "create" && saveIntent === "list") resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setLoading(null);
    }
  }

  function resetForm() {
    setName("");
    setCostPrice("");
    setMarkupPercent(String(shipping.defaultMarkupPercent));
    setQuantity("");
    setDescription("");
    setImages([]);
    setDelivery({ customerPaysDelivery: true, deliveryFeeZar: null });
    setStockOrigin(defaultStockOrigin);
    setSupplier({ tracked: false });
    setVariants(emptyVariantsConfig());
    setEnrichment(emptyEnrichment());
    setSpecial({ special_enabled: false, compare_at_price: "", sale_price: "" });
    setError("");
    setMessage("");
  }

  const canSaveDraft = Boolean(name.trim());
  const canList = Boolean(name.trim() && costPrice && Number(costPrice) > 0);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-950">Product details</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          {mode === "edit"
            ? "Update photos, pricing, variants, and details — then save as draft or list when ready."
            : "Same listing tools as admin: photos, pricing, variants, features, and optional supplier notes."}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ProductFormField label="Product name" className="sm:col-span-2">
            <input
              className="input"
              placeholder="e.g. Cordless drill kit"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </ProductFormField>
          <ProductFormField label="Category">
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {STORE_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label}
                </option>
              ))}
            </select>
          </ProductFormField>
          <ProductFormField label="Description" className="sm:col-span-2">
            <textarea
              className="input min-h-22 resize-y"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </ProductFormField>
          <SellerStockOriginField value={stockOrigin} onChange={setStockOrigin} />
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-950">Product images</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Upload photos or paste image URLs. The first image is used as the catalog thumbnail.
        </p>
        <div className="mt-4">
          <ProductImageField
            value={images}
            onChange={setImages}
            uploadUrl="/api/seller/products/upload"
          />
        </div>
      </section>

      <SellerPricingFields
        costPrice={costPrice}
        markupPercent={markupPercent}
        quantity={quantity}
        deliveryDaysMin={deliveryDaysMin}
        deliveryDaysMax={deliveryDaysMax}
        delivery={delivery}
        shipping={shipping}
        onCostChange={setCostPrice}
        onMarkupChange={setMarkupPercent}
        onQuantityChange={setQuantity}
        onDeliveryDaysChange={(key, value) =>
          key === "min" ? setDeliveryDaysMin(value) : setDeliveryDaysMax(value)
        }
        onDeliveryChange={(patch) => setDelivery((prev) => ({ ...prev, ...patch }))}
      />

      <ProductFormSpecialSection
        form={special}
        update={(key, value) => setSpecial((prev) => ({ ...prev, [key]: value }))}
      />

      <ProductEnrichmentEditor value={enrichment} onChange={setEnrichment} />
      <ProductVariantsEditor value={variants} onChange={setVariants} />
      <SellerSupplierFields value={supplier} onChange={setSupplier} />

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
        {sellerApproved ? (
          <p>
            <strong className="text-neutral-900">List product</strong> publishes immediately on your
            storefront. <strong className="text-neutral-900">Save as draft</strong> keeps it private
            until you are ready.
          </p>
        ) : (
          <p>
            <strong className="text-neutral-900">List product</strong> submits for marketplace review
            once your shop is approved. Drafts stay private in the meantime.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BtnSecondary
          type="button"
          disabled={loading !== null || !canSaveDraft}
          onClick={() => void save("draft")}
        >
          {loading === "draft" ? "Saving…" : listingIntentLabel("draft", sellerApproved)}
        </BtnSecondary>
        <BtnPrimary disabled={loading !== null || !canList} onClick={() => void save("list")}>
          {loading === "list" ? "Saving…" : listingIntentLabel("list", sellerApproved)}
        </BtnPrimary>
        {mode === "create" ? (
          <BtnSecondary type="button" onClick={resetForm}>
            Clear form
          </BtnSecondary>
        ) : null}
        {onCancel ? (
          <BtnSecondary type="button" onClick={onCancel}>
            Cancel
          </BtnSecondary>
        ) : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
