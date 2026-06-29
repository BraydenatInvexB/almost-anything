"use client";

import type { ProductEnrichment } from "@/types/product-enrichment";

type Props = {
  value: ProductEnrichment;
  onChange: (value: ProductEnrichment) => void;
};

export function ProductEnrichmentEditor({ value, onChange }: Props) {
  const highlightsText = value.highlights.join("\n");
  const specEntries = Object.entries(value.specifications);

  function updateHighlights(text: string) {
    onChange({
      ...value,
      highlights: text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
    });
  }

  function updateSpec(index: number, key: string, val: string) {
    const next = { ...value.specifications };
    const oldKey = specEntries[index]?.[0];
    if (oldKey && oldKey !== key) delete next[oldKey];
    if (key.trim()) next[key.trim()] = val;
    else if (oldKey) delete next[oldKey];
    onChange({ ...value, specifications: next });
  }

  function addSpec() {
    onChange({
      ...value,
      specifications: { ...value.specifications, "": "" },
    });
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-neutral-950">Product details</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Highlights and specs shown on the storefront. Filled automatically when products are sourced.
      </p>

      <label className="mt-4 block">
        <span className="text-xs font-medium text-neutral-600">Card summary (optional)</span>
        <input
          value={value.summary ?? ""}
          onChange={(e) => onChange({ ...value, summary: e.target.value })}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          placeholder="One line for search cards"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-medium text-neutral-600">Key features (one per line)</span>
        <textarea
          value={highlightsText}
          onChange={(e) => updateHighlights(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          placeholder="120Hz OLED display&#10;48MP triple camera&#10;All-day battery"
        />
      </label>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-neutral-600">Specifications</span>
          <button
            type="button"
            onClick={addSpec}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Add row
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {specEntries.length === 0 ? (
            <p className="text-xs text-neutral-400">No specifications yet.</p>
          ) : (
            specEntries.map(([k, v], i) => (
              <div key={`${i}-${k}`} className="grid grid-cols-2 gap-2">
                <input
                  value={k}
                  onChange={(e) => updateSpec(i, e.target.value, v)}
                  placeholder="Label"
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
                <input
                  value={v}
                  onChange={(e) => updateSpec(i, k, e.target.value)}
                  placeholder="Value"
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
