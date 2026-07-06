"use client";

import { SELLER_ENTITY_TYPES } from "@/config/seller-entity-types";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { SellerApplicationInput, SellerEntityType } from "@/types/seller";

interface SellerRegisterBusinessStepProps {
  form: SellerApplicationInput;
  onChange: (form: SellerApplicationInput) => void;
  onContinue: () => void;
}

const selectClassName =
  "w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export function SellerRegisterBusinessStep({
  form,
  onChange,
  onContinue,
}: SellerRegisterBusinessStepProps) {
  const canContinue =
    form.shopName.trim().length >= 2 &&
    form.companyName.trim().length >= 2 &&
    Boolean(form.entityType);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Business details</h2>

      <Input
        placeholder="Shop display name"
        value={form.shopName}
        onChange={(e) => onChange({ ...form, shopName: e.target.value })}
        required
      />

      <div>
        <label htmlFor="entity-type" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Legal entity type
        </label>
        <select
          id="entity-type"
          value={form.entityType}
          onChange={(e) => onChange({ ...form, entityType: e.target.value as SellerEntityType })}
          className={selectClassName}
          required
        >
          {SELLER_ENTITY_TYPES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-neutral-500">
          {SELLER_ENTITY_TYPES.find((option) => option.id === form.entityType)?.description}
        </p>
      </div>

      <Input
        placeholder="Registered company / trading name"
        value={form.companyName}
        onChange={(e) => onChange({ ...form, companyName: e.target.value })}
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder={
            form.entityType === "sole_proprietor"
              ? "ID / registration number (optional)"
              : "CIPC registration number"
          }
          value={form.registrationNumber}
          onChange={(e) => onChange({ ...form, registrationNumber: e.target.value })}
        />
        <Input
          placeholder="VAT number (optional)"
          value={form.vatNumber}
          onChange={(e) => onChange({ ...form, vatNumber: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          type="email"
          placeholder="Contact email"
          value={form.contactEmail}
          onChange={(e) => onChange({ ...form, contactEmail: e.target.value })}
          required
        />
        <Input
          placeholder="Contact phone"
          value={form.contactPhone}
          onChange={(e) => onChange({ ...form, contactPhone: e.target.value })}
          required
        />
      </div>

      <textarea
        placeholder="Tell customers about your business"
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
        className="min-h-24 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
      />

      <Button type="button" className="w-full" onClick={onContinue} disabled={!canContinue}>
        Continue
      </Button>
    </div>
  );
}
