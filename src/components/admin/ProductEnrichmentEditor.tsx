"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ProductEnrichment } from "@/types/product-enrichment";

type Props = {
  value: ProductEnrichment;
  onChange: (value: ProductEnrichment) => void;
};

type SpecRow = { id: number; label: string; value: string };

function rowsFromSpecifications(specifications: Record<string, string>): SpecRow[] {
  return Object.entries(specifications).map(([label, value], index) => ({ id: index + 1, label, value }));
}

export function ProductEnrichmentEditor({ value, onChange }: Props) {
  const nextId = useRef(Object.keys(value.specifications).length + 1);
  const lastEmitted = useRef<ProductEnrichment | null>(null);
  const [highlightsText, setHighlightsText] = useState(() => value.highlights.join("\n"));
  const [specRows, setSpecRows] = useState<SpecRow[]>(() => rowsFromSpecifications(value.specifications));

  useEffect(() => {
    if (value === lastEmitted.current) return;
    setHighlightsText(value.highlights.join("\n"));
    const rows = rowsFromSpecifications(value.specifications);
    setSpecRows(rows);
    nextId.current = rows.length + 1;
  }, [value]);

  function emit(patch: Partial<ProductEnrichment>) {
    const next = { ...value, ...patch };
    lastEmitted.current = next;
    onChange(next);
  }

  function updateHighlights(text: string) {
    setHighlightsText(text);
    emit({
      highlights: text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    });
  }

  function commitSpecs(rows: SpecRow[]) {
    setSpecRows(rows);
    emit({
      specifications: Object.fromEntries(
        rows
          .map((row) => [row.label.trim(), row.value.trim()] as const)
          .filter(([label]) => Boolean(label)),
      ),
    });
  }

  function updateSpec(id: number, patch: Partial<Omit<SpecRow, "id">>) {
    commitSpecs(specRows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addSpec() {
    setSpecRows((rows) => [...rows, { id: nextId.current++, label: "", value: "" }]);
  }

  function removeSpec(id: number) {
    commitSpecs(specRows.filter((row) => row.id !== id));
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-neutral-950">Storefront content</h2>
      <p className="mt-1 text-xs leading-5 text-neutral-500">
        Add the information shoppers will see on the product page. Your text stays in place while you edit.
      </p>

      <label className="mt-5 block">
        <span className="text-xs font-semibold text-neutral-700">Short summary</span>
        <span className="ml-2 text-[11px] text-neutral-400">Optional</span>
        <input
          value={value.summary ?? ""}
          onChange={(event) => emit({ summary: event.target.value })}
          className="input mt-1.5"
          placeholder="A short introduction shown near the product details"
        />
      </label>

      <label className="mt-5 block">
        <span className="text-xs font-semibold text-neutral-700">Key features</span>
        <span className="ml-2 text-[11px] text-neutral-400">Enter one feature per line</span>
        <textarea
          value={highlightsText}
          onChange={(event) => updateHighlights(event.target.value)}
          rows={5}
          className="input mt-1.5 min-h-32 resize-y leading-6"
          placeholder="Long battery life&#10;Lightweight design&#10;Two year warranty"
        />
      </label>

      <div className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-neutral-700">Specifications</p>
            <p className="mt-0.5 text-[11px] text-neutral-400">Use a label and value, for example Material and Stainless steel.</p>
          </div>
          <button type="button" onClick={addSpec} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-3 text-xs font-semibold text-neutral-700 hover:border-brand hover:text-brand">
            <Plus className="h-3.5 w-3.5" /> Add specification
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {specRows.length === 0 ? (
            <button type="button" onClick={addSpec} className="w-full rounded-xl border border-dashed border-neutral-300 px-4 py-5 text-sm text-neutral-500 hover:border-brand hover:text-brand">
              Add your first specification
            </button>
          ) : (
            specRows.map((row) => (
              <div key={row.id} className="grid gap-2 rounded-xl bg-neutral-50 p-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_2.25rem]">
                <input value={row.label} onChange={(event) => updateSpec(row.id, { label: event.target.value })} placeholder="Specification name" className="input bg-white" />
                <input value={row.value} onChange={(event) => updateSpec(row.id, { value: event.target.value })} placeholder="Specification value" className="input bg-white" />
                <button type="button" onClick={() => removeSpec(row.id)} aria-label="Remove specification" className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
