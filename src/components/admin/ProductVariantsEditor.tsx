"use client";

import { useState } from "react";
import { Check, Plus, Trash2, X } from "lucide-react";
import type { ProductVariant, ProductVariantsConfig } from "@/types/product-variants";
import { buildVariantMatrix } from "@/types/product-variants";

interface ProductVariantsEditorProps {
  value: ProductVariantsConfig;
  onChange: (value: ProductVariantsConfig) => void;
}

const OPTION_SUGGESTIONS = ["Colour", "Size", "Material", "Style"];

function mergeVariantRows(next: ProductVariant[], current: ProductVariant[]) {
  const currentById = new Map(current.map((variant) => [variant.id, variant]));
  return next.map((variant) => ({ ...variant, ...currentById.get(variant.id), selections: variant.selections }));
}

export function ProductVariantsEditor({ value, onChange }: ProductVariantsEditorProps) {
  const enabled = value.options.length > 0;
  const [draftValues, setDraftValues] = useState<Record<number, string>>({});

  function syncOptions(options: ProductVariantsConfig["options"]) {
    const cleaned = options.map((option) => ({
      name: option.name,
      values: option.values.filter(Boolean),
    }));
    const matrix = buildVariantMatrix(cleaned);
    onChange({ options: cleaned, variants: mergeVariantRows(matrix, value.variants) });
  }

  function updateOption(index: number, patch: Partial<ProductVariantsConfig["options"][0]>) {
    syncOptions(value.options.map((option, optionIndex) => optionIndex === index ? { ...option, ...patch } : option));
  }

  function addOption(name = "") {
    if (value.options.length >= 3) return;
    syncOptions([...value.options, { name, values: [] }]);
  }

  function removeOption(index: number) {
    syncOptions(value.options.filter((_, optionIndex) => optionIndex !== index));
  }

  function addValue(index: number) {
    const draft = draftValues[index]?.trim();
    if (!draft) return;
    const option = value.options[index];
    const values = Array.from(new Set([...option.values, draft]));
    updateOption(index, { values });
    setDraftValues((current) => ({ ...current, [index]: "" }));
  }

  function removeValue(optionIndex: number, item: string) {
    updateOption(optionIndex, { values: value.options[optionIndex].values.filter((valueItem) => valueItem !== item) });
  }

  function updateVariantRow(id: string, patch: Partial<ProductVariant>) {
    onChange({
      ...value,
      variants: value.variants.map((variant) => variant.id === id ? { ...variant, ...patch } : variant),
    });
  }

  if (!enabled) {
    return (
      <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-950">Product options</h2>
            <p className="mt-1 text-xs leading-5 text-neutral-500">Add choices only when shoppers need to select a colour, size or style.</p>
          </div>
          <button type="button" onClick={() => addOption("Colour")} className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-4 text-sm font-semibold text-white hover:bg-brand">
            <Plus className="h-4 w-4" /> Add product options
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">Product options</h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">Add each choice below. Variant combinations are created automatically.</p>
        </div>
        <button type="button" onClick={() => onChange({ options: [], variants: [] })} className="text-xs font-semibold text-neutral-400 hover:text-red-600">Remove all options</button>
      </div>

      <div className="mt-5 space-y-4">
        {value.options.map((option, index) => (
          <div key={index} className="rounded-2xl border border-neutral-200 bg-[#faf9f7] p-4">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <label className="text-xs font-semibold text-neutral-700">Option name</label>
                <input
                  className="input mt-1.5 bg-white"
                  value={option.name}
                  onChange={(event) => updateOption(index, { name: event.target.value })}
                  placeholder="For example Colour or Size"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {OPTION_SUGGESTIONS.filter((suggestion) => !value.options.some((item) => item.name === suggestion) || option.name === suggestion).map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => updateOption(index, { name: suggestion })} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${option.name === suggestion ? "bg-[#fff0f1] text-brand" : "bg-white text-neutral-500 hover:text-neutral-900"}`}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => removeOption(index)} className="mt-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 hover:text-red-600" aria-label="Remove option">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-neutral-700">Choices</label>
              {option.values.length ? (
                <div className="mt-2 space-y-2">
                  {option.values.map((item) => (
                    <div key={item} className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <span>{item}</span>
                      <button type="button" onClick={() => removeValue(index, item)} aria-label={`Remove ${item}`} className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 flex gap-2">
                <input
                  className="input bg-white"
                  value={draftValues[index] ?? ""}
                  onChange={(event) => setDraftValues((current) => ({ ...current, [index]: event.target.value }))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addValue(index);
                    }
                  }}
                  placeholder="Type a choice, then press Enter"
                />
                <button type="button" onClick={() => addValue(index)} className="shrink-0 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 hover:border-brand hover:text-brand">Add</button>
              </div>
            </div>
          </div>
        ))}

        {value.options.length < 3 ? (
          <button type="button" onClick={() => addOption()} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 hover:border-brand hover:text-brand">
            <Plus className="h-3.5 w-3.5" /> Add another option
          </button>
        ) : null}

        {value.variants.length ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-emerald-700">
              <Check className="h-4 w-4" /> {value.variants.length} combinations created automatically
            </div>
            <div className="overflow-x-auto rounded-xl border border-neutral-200">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 text-left text-[11px] uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-3 py-2.5">Variant</th>
                    <th className="px-3 py-2.5">SKU</th>
                    <th className="px-3 py-2.5">Price change</th>
                    <th className="px-3 py-2.5">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {value.variants.map((variant) => (
                    <tr key={variant.id} className="border-t border-neutral-100">
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium text-neutral-800">{Object.values(variant.selections).join(" / ")}</td>
                      <td className="px-3 py-2"><input className="input h-9 min-w-28" value={variant.sku ?? ""} onChange={(event) => updateVariantRow(variant.id, { sku: event.target.value })} placeholder="Optional SKU" /></td>
                      <td className="px-3 py-2"><input type="number" className="input h-9 w-28" value={variant.priceAdjust ?? 0} onChange={(event) => updateVariantRow(variant.id, { priceAdjust: Number(event.target.value) })} aria-label="Price adjustment" /></td>
                      <td className="px-3 py-2"><input type="number" min="0" className="input h-9 w-24" value={variant.stock ?? 0} onChange={(event) => updateVariantRow(variant.id, { stock: Number(event.target.value) })} aria-label="Variant stock" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">Price change is added to the main product price. Use 0 when the price stays the same.</p>
          </div>
        ) : (
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800">Add at least one choice to every option to create the variants.</p>
        )}
      </div>
    </section>
  );
}
