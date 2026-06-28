"use client";

import { Plus, Trash2, Wand2 } from "lucide-react";
import type { ProductVariantsConfig } from "@/types/product-variants";
import { buildVariantMatrix } from "@/types/product-variants";

interface ProductVariantsEditorProps {
  value: ProductVariantsConfig;
  onChange: (value: ProductVariantsConfig) => void;
}

export function ProductVariantsEditor({ value, onChange }: ProductVariantsEditorProps) {
  const enabled = value.options.length > 0 || value.variants.length > 0;

  function setOptions(options: ProductVariantsConfig["options"]) {
    onChange({ ...value, options });
  }

  function addOption() {
    setOptions([...value.options, { name: "Option", values: ["Value 1"] }]);
  }

  function updateOption(index: number, patch: Partial<ProductVariantsConfig["options"][0]>) {
    setOptions(value.options.map((opt, i) => (i === index ? { ...opt, ...patch } : opt)));
  }

  function removeOption(index: number) {
    const options = value.options.filter((_, i) => i !== index);
    onChange({ options, variants: [] });
  }

  function generateVariants() {
    onChange({ ...value, variants: buildVariantMatrix(value.options) });
  }

  function updateVariantRow(id: string, patch: Partial<ProductVariantsConfig["variants"][0]>) {
    onChange({
      ...value,
      variants: value.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-neutral-950">Options & variants</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Add colour, size, or other choices shoppers pick before adding to cart.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? { options: [{ name: "Colour", values: ["Black", "White"] }], variants: [] }
                  : { options: [], variants: [] },
              )
            }
          />
          Enable variants
        </label>
      </div>

      {enabled ? (
        <div className="mt-4 space-y-4">
          {value.options.map((opt, index) => (
            <div key={index} className="rounded-lg border border-neutral-100 bg-neutral-50 p-4">
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  value={opt.name}
                  onChange={(e) => updateOption(index, { name: e.target.value })}
                  placeholder="Option name (e.g. Colour)"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-white"
                  aria-label="Remove option"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input
                className="input mt-2"
                value={opt.values.join(", ")}
                onChange={(e) =>
                  updateOption(index, {
                    values: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Values separated by commas (e.g. Black, White, Navy)"
              />
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addOption}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              <Plus className="h-4 w-4" /> Add option
            </button>
            <button
              type="button"
              onClick={generateVariants}
              disabled={!value.options.length}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
            >
              <Wand2 className="h-4 w-4" /> Generate combinations
            </button>
          </div>

          {value.variants.length ? (
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">Variant</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">Price +/-</th>
                    <th className="px-3 py-2">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {value.variants.map((variant) => (
                    <tr key={variant.id} className="border-t border-neutral-100">
                      <td className="px-3 py-2 font-medium text-neutral-800">
                        {Object.values(variant.selections).join(" / ")}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          className="input h-8 min-w-[100px]"
                          value={variant.sku ?? ""}
                          onChange={(e) => updateVariantRow(variant.id, { sku: e.target.value })}
                          placeholder="SKU"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="input h-8 w-24"
                          value={variant.priceAdjust ?? 0}
                          onChange={(e) =>
                            updateVariantRow(variant.id, { priceAdjust: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          className="input h-8 w-20"
                          value={variant.stock ?? 0}
                          onChange={(e) =>
                            updateVariantRow(variant.id, { stock: Number(e.target.value) })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
