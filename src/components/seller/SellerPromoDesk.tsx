"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface PromoRow {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  status: string;
}

export function SellerPromoDesk() {
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [code, setCode] = useState("");
  const [value, setValue] = useState("10");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/seller/promos")
      .then((r) => r.json())
      .then((data) => setPromos(data.promos ?? []))
      .catch(() => setPromos([]));
  }, []);

  async function createPromo() {
    setLoading(true);
    try {
      const res = await fetch("/api/seller/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, discountValue: Number(value), discountType: "percent" }),
      });
      const data = await res.json();
      if (data.promo) setPromos((list) => [data.promo, ...list]);
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Create promo code</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <Input type="number" placeholder="Discount %" value={value} onChange={(e) => setValue(e.target.value)} />
          <Button type="button" isLoading={loading} onClick={() => void createPromo()}>Create</Button>
        </div>
      </Card>
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Your promos</h2>
        <ul className="mt-4 space-y-2">
          {promos.map((promo) => (
            <li key={promo.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 text-sm">
              <span className="font-semibold">{promo.code}</span>
              <span>{promo.discount_value}% · {promo.status}</span>
            </li>
          ))}
          {!promos.length ? <p className="text-sm text-neutral-500">No promo codes yet.</p> : null}
        </ul>
      </Card>
    </div>
  );
}
