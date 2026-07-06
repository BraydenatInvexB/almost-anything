"use client";

import { useState } from "react";
import { ProductImageField } from "@/components/admin/ProductImageField";
import { ProductFormField } from "@/components/admin/ProductFormField";
import { BtnPrimary, BtnSecondary } from "@/components/admin/ui";
import { SA_WAREHOUSE_DELIVERY_DAYS } from "@/config/delivery";
import { STORE_CATEGORIES } from "@/config/categories";
import { retailFromCost } from "@/lib/seller/product-pricing";
import { SellerPricingFields } from "@/components/seller/SellerPricingFields";
import type { SellerCatalogProduct, SellerCatalogShipping, SellerDeliverySettings } from "@/types/seller-catalog";

export function SellerCatalogAddTab({
  shipping,
  onAdded,
}: {
  shipping: SellerCatalogShipping;
  onAdded: (product: SellerCatalogProduct) => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [markupPercent, setMarkupPercent] = useState(String(shipping.defaultMarkupPercent));
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState(STORE_CATEGORIES[0]?.slug ?? "general");
  const [description, setDescription] = useState("");
  const [deliveryDaysMin, setDeliveryDaysMin] = useState(String(SA_WAREHOUSE_DELIVERY_DAYS.min));
  const [deliveryDaysMax, setDeliveryDaysMax] = useState(String(SA_WAREHOUSE_DELIVERY_DAYS.max));
  const [delivery, setDelivery] = useState<SellerDeliverySettings>({ customerPaysDelivery: true, deliveryFeeZar: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    const cost = Number(costPrice);
    const markup = Number(markupPercent);
    const retail = retailFromCost(cost, markup);
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          costPrice: cost,
          markupPercent: markup,
          retailPrice: retail,
          stockQuantity: Number(quantity),
          category,
          imageUrls: images,
          description: description || undefined,
          deliveryDaysMin: Number(deliveryDaysMin),
          deliveryDaysMax: Number(deliveryDaysMax),
          delivery,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save product");

      onAdded({
        id: data.product.id,
        name,
        slug: data.product.slug,
        base_price: cost,
        retail_price: retail,
        markup_percent: markup,
        stock_quantity: Number(quantity),
        category,
        listing_status: "published",
        image_url: images[0] ?? null,
        delivery_days_min: Number(deliveryDaysMin),
        delivery_days_max: Number(deliveryDaysMax),
        metadata: { seller_delivery: { customer_pays: delivery.customerPaysDelivery, fee_zar: delivery.deliveryFeeZar } },
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setLoading(false);
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
    setError("");
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-950">Product details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ProductFormField label="Product name" className="sm:col-span-2">
            <input className="input" placeholder="e.g. Cordless drill kit" value={name} onChange={(e) => setName(e.target.value)} />
          </ProductFormField>
          <ProductFormField label="Category">
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
              {STORE_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.label}</option>
              ))}
            </select>
          </ProductFormField>
          <ProductFormField label="Description" className="sm:col-span-2">
            <textarea className="input min-h-[88px] resize-y" placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </ProductFormField>
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
        onDeliveryDaysChange={(key, value) => (key === "min" ? setDeliveryDaysMin(value) : setDeliveryDaysMax(value))}
        onDeliveryChange={(patch) => setDelivery((prev) => ({ ...prev, ...patch }))}
      />

      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-950">Product images</h2>
        <div className="mt-4">
          <ProductImageField value={images} onChange={setImages} uploadUrl="/api/seller/products/upload" />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <BtnPrimary disabled={loading || !name || !costPrice || !quantity} onClick={() => void save()}>
          {loading ? "Saving…" : "Save to catalog"}
        </BtnPrimary>
        <BtnSecondary type="button" onClick={resetForm}>Clear form</BtnSecondary>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
