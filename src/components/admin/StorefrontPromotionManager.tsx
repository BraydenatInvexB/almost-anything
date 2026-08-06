"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";
import type { Product } from "@/types/database";
import type { Campaign } from "@/lib/admin/operations-types";
import { BtnPrimary, StatusBadge } from "@/components/admin/ui";

interface PromotionFormState {
  name: string;
  storefrontLabel: string;
  status: "draft" | "scheduled" | "live";
  startsAt: string;
  endsAt: string;
  storefrontOrder: string;
  storefrontProductSlugs: string[];
}

function toLocalInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function emptyForm(): PromotionFormState {
  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setDate(endsAt.getDate() + 14);
  return {
    name: "",
    storefrontLabel: "",
    status: "draft",
    startsAt: toLocalInputValue(startsAt),
    endsAt: toLocalInputValue(endsAt),
    storefrontOrder: "0",
    storefrontProductSlugs: [],
  };
}

function campaignToForm(campaign: Campaign): PromotionFormState {
  return {
    name: campaign.name,
    storefrontLabel: campaign.storefrontLabel ?? campaign.name,
    status:
      campaign.status === "scheduled" || campaign.status === "live"
        ? campaign.status
        : "draft",
    startsAt: toLocalInputValue(campaign.startsAt),
    endsAt: toLocalInputValue(
      campaign.endsAt ?? new Date(Date.parse(campaign.startsAt) + 14 * 86_400_000),
    ),
    storefrontOrder: String(campaign.storefrontOrder),
    storefrontProductSlugs: campaign.storefrontProductSlugs,
  };
}

function formatEventWindow(campaign: Campaign): string {
  const formatter = new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const start = formatter.format(new Date(campaign.startsAt));
  const end = campaign.endsAt ? formatter.format(new Date(campaign.endsAt)) : "No end date";
  return `${start} to ${end}`;
}

export function StorefrontPromotionManager({
  initial,
  products,
  canManage,
}: {
  initial: Campaign[];
  products: Product[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [events, setEvents] = useState(initial);
  const [form, setForm] = useState<PromotionFormState | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const uniqueProducts = useMemo(
    () => Array.from(new Map(products.map((product) => [product.slug, product])).values()),
    [products],
  );
  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) return uniqueProducts.slice(0, 40);
    return uniqueProducts
      .filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.slug.toLowerCase().includes(query),
      )
      .slice(0, 40);
  }, [productSearch, uniqueProducts]);
  const productsBySlug = useMemo(
    () => new Map(uniqueProducts.map((product) => [product.slug, product])),
    [uniqueProducts],
  );

  function closeForm() {
    setForm(null);
    setEditingId(null);
    setProductSearch("");
    setError("");
  }

  function toggleProduct(slug: string) {
    if (!form) return;
    setForm({
      ...form,
      storefrontProductSlugs: form.storefrontProductSlugs.includes(slug)
        ? form.storefrontProductSlugs.filter((value) => value !== slug)
        : [...form.storefrontProductSlugs, slug],
    });
  }

  async function saveEvent(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    setError("");
    if (!form.storefrontProductSlugs.length) {
      setError("Select at least one product for this promotional event.");
      return;
    }
    if (new Date(form.endsAt) <= new Date(form.startsAt)) {
      setError("The event end date must be after its start date.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        channel: "banner" as const,
        status: form.status,
        audience: "Storefront shoppers",
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        storefrontEnabled: true,
        storefrontLabel: form.storefrontLabel.trim(),
        storefrontProductSlugs: form.storefrontProductSlugs,
        storefrontOrder: Number(form.storefrontOrder) || 0,
      };
      const response = await fetch("/api/admin/campaigns", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      const data = await response.json();
      if (!response.ok || !data.campaign) {
        setError(data.error ?? "The promotional event could not be saved.");
        return;
      }
      setEvents((current) =>
        editingId
          ? current.map((campaign) =>
              campaign.id === editingId ? data.campaign : campaign,
            )
          : [data.campaign, ...current],
      );
      closeForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function endEvent(id: string) {
    const response = await fetch("/api/admin/campaigns", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "ended" }),
    });
    const data = await response.json();
    if (data.campaign) {
      setEvents((current) =>
        current.map((campaign) => (campaign.id === id ? data.campaign : campaign)),
      );
      router.refresh();
    }
  }

  async function removeEvent(id: string) {
    const response = await fetch(`/api/admin/campaigns?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!response.ok) return;
    setEvents((current) => current.filter((campaign) => campaign.id !== id));
    router.refresh();
  }

  return (
    <div>
      {canManage ? (
        <div className="border-b border-neutral-100 p-5">
          {!form ? (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              <Plus className="h-4 w-4" /> Add promotional event
            </button>
          ) : (
            <form onSubmit={saveEvent} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5 text-xs font-semibold text-neutral-600">
                  Internal event name
                  <input
                    className="input"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="Father's Day 2027"
                    required
                  />
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-neutral-600">
                  Storefront tab label
                  <input
                    className="input"
                    value={form.storefrontLabel}
                    onChange={(event) =>
                      setForm({ ...form, storefrontLabel: event.target.value })
                    }
                    placeholder="Father's Day"
                    maxLength={28}
                    required
                  />
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-neutral-600">
                  Publishing status
                  <select
                    className="input"
                    value={form.status}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        status: event.target.value as PromotionFormState["status"],
                      })
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="live">Live during selected dates</option>
                  </select>
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-neutral-600">
                  Tab position
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    value={form.storefrontOrder}
                    onChange={(event) =>
                      setForm({ ...form, storefrontOrder: event.target.value })
                    }
                  />
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-neutral-600">
                  Starts
                  <input
                    className="input"
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                    required
                  />
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-neutral-600">
                  Ends
                  <input
                    className="input"
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-neutral-950">Products in this event</p>
                    <p className="text-xs text-neutral-500">
                      Only selected products appear when a shopper opens this tab.
                    </p>
                  </div>
                  <div className="relative sm:w-72">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      className="input pl-9"
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search products"
                    />
                  </div>
                </div>

                {form.storefrontProductSlugs.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.storefrontProductSlugs.map((slug) => (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => toggleProduct(slug)}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 ring-1 ring-neutral-200"
                      >
                        <span className="max-w-56 truncate">
                          {productsBySlug.get(slug)?.name ?? slug}
                        </span>
                        <X className="h-3 w-3 text-neutral-400" />
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleProducts.map((product) => {
                    const selected = form.storefrontProductSlugs.includes(product.slug);
                    const imageUrl = product.enhanced_image_url ?? product.image_url;
                    return (
                      <label
                        key={product.slug}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-colors ${
                          selected
                            ? "border-brand/40 bg-brand-soft"
                            : "border-neutral-200 bg-white hover:border-neutral-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleProduct(product.slug)}
                          className="h-4 w-4 accent-brand"
                        />
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 rounded-md bg-white object-contain"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-neutral-100">
                            <Tag className="h-4 w-4 text-neutral-400" />
                          </span>
                        )}
                        <span className="min-w-0 truncate text-xs font-medium text-neutral-800">
                          {product.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center gap-3">
                <BtnPrimary type="submit" disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Save event" : "Create event"}
                </BtnPrimary>
                <button
                  type="button"
                  onClick={closeForm}
                  className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      <div className="divide-y divide-neutral-100">
        {events.map((campaign) => (
          <div key={campaign.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <CalendarDays className="h-5 w-5" />
            </span>
            <div className="min-w-48 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-neutral-950">{campaign.name}</p>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                  Tab: {campaign.storefrontLabel}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-500">
                {formatEventWindow(campaign)} · {campaign.storefrontProductSlugs.length}{" "}
                {campaign.storefrontProductSlugs.length === 1 ? "product" : "products"}
              </p>
            </div>
            <StatusBadge status={campaign.status} />
            {canManage ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(campaign.id);
                    setForm(campaignToForm(campaign));
                    setError("");
                  }}
                  className="rounded-lg border border-neutral-200 p-2 text-neutral-600 hover:bg-neutral-50"
                  aria-label={`Edit ${campaign.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {campaign.status !== "ended" ? (
                  <button
                    type="button"
                    onClick={() => endEvent(campaign.id)}
                    className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
                  >
                    End
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeEvent(campaign.id)}
                  className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  aria-label={`Delete ${campaign.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        ))}
        {!events.length ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-semibold text-neutral-800">No storefront events yet</p>
            <p className="mt-1 text-xs text-neutral-500">
              Add a seasonal promotion and schedule when its storefront tab should appear.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
