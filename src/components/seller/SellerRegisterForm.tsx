"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STORE_CATEGORIES } from "@/config/categories";
import { SELLER_PLANS } from "@/config/seller-plans";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SellerRegisterBusinessStep } from "@/components/seller/SellerRegisterBusinessStep";
import type { SellerApplicationInput, SellerPlan } from "@/types/seller";

const INITIAL_FORM: SellerApplicationInput = {
  shopName: "",
  companyName: "",
  entityType: "private_company",
  registrationNumber: "",
  vatNumber: "",
  contactEmail: "",
  contactPhone: "",
  description: "",
  plan: "starter_30",
  categorySlugs: [],
  sellsAllCategories: false,
  businessAddress: {
    line1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "ZA",
  },
};

export function SellerRegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<SellerApplicationInput>(INITIAL_FORM);

  function toggleCategory(slug: string) {
    setForm((prev) => ({
      ...prev,
      categorySlugs: prev.categorySlugs.includes(slug)
        ? prev.categorySlugs.filter((s) => s !== slug)
        : [...prev.categorySlugs, slug],
    }));
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seller/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Application failed");
      router.push(
        `/sell/register/payment?sellerId=${encodeURIComponent(data.seller.id)}&plan=${encodeURIComponent(form.plan)}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card variant="elevated" className="mx-auto max-w-2xl bg-white p-6 sm:p-8">
      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1.5 flex-1 rounded-full ${step >= n ? "bg-brand" : "bg-neutral-200"}`} />
        ))}
      </div>

      {step === 1 ? (
        <SellerRegisterBusinessStep
          form={form}
          onChange={setForm}
          onContinue={() => setStep(2)}
        />
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Choose your plan</h2>
          <p className="text-sm text-neutral-600">Billing only starts when you make your first sale.</p>
          <div className="space-y-3">
            {SELLER_PLANS.map((plan) => (
              <label key={plan.id} className={`flex cursor-pointer gap-3 rounded-2xl border-2 p-4 ${form.plan === plan.id ? "border-brand bg-brand/5" : "border-neutral-200"}`}>
                <input type="radio" name="plan" checked={form.plan === plan.id} onChange={() => setForm({ ...form, plan: plan.id as SellerPlan })} />
                <div>
                  <p className="font-semibold">{plan.name} · R{plan.priceMonthly}/mo</p>
                  <p className="text-sm text-neutral-600">{plan.description}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" className="flex-1" onClick={() => setStep(3)}>Continue</Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Categories & address</h2>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.sellsAllCategories} onChange={(e) => setForm({ ...form, sellsAllCategories: e.target.checked })} />
            Sell in all categories
          </label>
          {!form.sellsAllCategories ? (
            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-neutral-200 p-3">
              {STORE_CATEGORIES.map((cat) => (
                <label key={cat.slug} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.categorySlugs.includes(cat.slug)} onChange={() => toggleCategory(cat.slug)} />
                  {cat.label}
                </label>
              ))}
            </div>
          ) : null}
          <Input placeholder="Business address line 1" value={form.businessAddress.line1} onChange={(e) => setForm({ ...form, businessAddress: { ...form.businessAddress, line1: e.target.value } })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="City" value={form.businessAddress.city} onChange={(e) => setForm({ ...form, businessAddress: { ...form.businessAddress, city: e.target.value } })} />
            <Input placeholder="Province" value={form.businessAddress.state} onChange={(e) => setForm({ ...form, businessAddress: { ...form.businessAddress, state: e.target.value } })} />
          </div>
          <Input placeholder="Postal code" value={form.businessAddress.postalCode} onChange={(e) => setForm({ ...form, businessAddress: { ...form.businessAddress, postalCode: e.target.value } })} />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button>
            <Button type="button" className="flex-1" isLoading={loading} onClick={() => void submit()}>Submit application</Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
    </Card>
  );
}
