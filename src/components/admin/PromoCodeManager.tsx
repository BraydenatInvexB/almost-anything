"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types/database";
import type { PromoCode } from "@/lib/admin/operations-types";
import { StatusBadge } from "@/components/admin/ui";
import {
  EMPTY_PROMO_FORM,
  PromoCodeForm,
  promoFormToPayload,
  promoToFormState,
} from "@/components/admin/PromoCodeForm";

function scopeLabel(promo: PromoCode) {
  if (promo.scope === "all") return "All products";
  if (promo.scope === "products") return `${promo.productIds.length} products`;
  return `${promo.categorySlugs.length} categories`;
}

function discountLabel(promo: PromoCode) {
  return promo.discountType === "percent"
    ? `${promo.discountValue}% off`
    : `R${promo.discountValue} off`;
}

export function PromoCodeManager({
  initial,
  products,
  canManage,
}: {
  initial: PromoCode[];
  products: Product[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [promoCodes, setPromoCodes] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function savePromo(form: typeof EMPTY_PROMO_FORM) {
    const payload = promoFormToPayload(form);
    const isEdit = Boolean(editingId);
    const res = await fetch("/api/admin/promo-codes", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { id: editingId, ...payload } : payload),
    });
    const data = await res.json();
    if (!data.promoCode) return;

    setPromoCodes((list) =>
      isEdit
        ? list.map((promo) => (promo.id === editingId ? data.promoCode : promo))
        : [data.promoCode, ...list],
    );
    setShowForm(false);
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/promo-codes?id=${id}`, { method: "DELETE" });
    setPromoCodes((list) => list.filter((promo) => promo.id !== id));
  }

  function startEdit(promo: PromoCode) {
    setEditingId(promo.id);
    setShowForm(true);
  }

  const editingPromo = editingId
    ? promoCodes.find((promo) => promo.id === editingId)
    : null;

  return (
    <div>
      {canManage && (
        <div className="border-b border-neutral-100 px-5 py-4">
          {!showForm ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" /> New promo code
            </button>
          ) : (
            <PromoCodeForm
              products={products}
              initial={editingPromo ? promoToFormState(editingPromo) : EMPTY_PROMO_FORM}
              submitLabel={editingId ? "Save changes" : "Create promo code"}
              onSubmit={savePromo}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            />
          )}
        </div>
      )}

      <div className="divide-y divide-neutral-100">
        {promoCodes.map((promo) => (
          <div key={promo.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-neutral-950">{promo.code}</p>
              <p className="text-xs text-neutral-500">
                {promo.label || discountLabel(promo)} · {scopeLabel(promo)} · Used{" "}
                {promo.usageCount}
                {promo.usageLimit ? ` / ${promo.usageLimit}` : ""}
              </p>
            </div>
            <StatusBadge status={promo.status} />
            {canManage && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => startEdit(promo)}
                  className="rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-neutral-50"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(promo.id)}
                  className="rounded-lg p-1 text-red-500 hover:bg-red-50"
                  aria-label="Delete promo code"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {!promoCodes.length ? (
          <p className="px-5 py-8 text-sm text-neutral-500">No promo codes yet.</p>
        ) : null}
      </div>
    </div>
  );
}
