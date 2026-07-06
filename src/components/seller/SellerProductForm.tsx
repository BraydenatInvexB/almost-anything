"use client";

import { ProductImageField } from "@/components/admin/ProductImageField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useState } from "react";

export function SellerProductForm() {
  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function save() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          retailPrice: Number(price),
          stockQuantity: Number(quantity),
          category,
          imageUrls: images,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save product");
      setMessage("Product saved.");
      setName("");
      setPrice("");
      setQuantity("");
      setCategory("");
      setImages([]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="elevated" className="p-6">
      <h2 className="text-lg font-semibold">Add product</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Input placeholder="Price (ZAR)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input placeholder="Stock quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <Input placeholder="Category slug" value={category} onChange={(e) => setCategory(e.target.value)} className="sm:col-span-2" />
        <ProductImageField value={images} onChange={setImages} uploadUrl="/api/seller/products/upload" />
      </div>
      <Button type="button" className="mt-4" isLoading={loading} onClick={() => void save()}>Save product</Button>
      {message ? <p className="mt-3 text-sm text-neutral-600">{message}</p> : null}
    </Card>
  );
}
