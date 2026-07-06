"use client";

import { useRef, useState, type DragEvent } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, XCircle } from "lucide-react";
import { BtnSecondary } from "@/components/admin/ui";
import { Panel } from "@/components/admin/ui";
import { stockImportTemplate } from "@/lib/seller/stock-import-parser";
import { cn } from "@/lib/utils/cn";

const CSV_COLUMNS = ["name", "sku", "cost_price", "markup_percent", "price", "quantity", "warehouse", "category", "description", "image_url"];

export function StockImportPanel({
  embedded = false,
  onImported,
}: {
  embedded?: boolean;
  onImported?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null);

  async function importFile(file: File | null) {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const text = await file.text();
      const res = await fetch("/api/seller/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text, fileName: file.name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setResult({ success: data.successCount ?? 0, errors: data.errors ?? [] });
      if ((data.successCount ?? 0) > 0) onImported?.();
    } catch (err) {
      setResult({ success: 0, errors: [err instanceof Error ? err.message : "Import failed"] });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const blob = new Blob([stockImportTemplate()], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void importFile(file);
  }

  const body = (
    <div className="space-y-4 p-5">
      <div className="flex flex-wrap gap-2">
        {CSV_COLUMNS.map((column) => (
          <span key={column} className="rounded-md bg-neutral-100 px-2.5 py-1 font-mono text-xs text-neutral-600">
            {column}
          </span>
        ))}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragging ? "border-brand bg-brand/5" : "border-neutral-200 bg-neutral-50/50 hover:border-neutral-300",
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-brand" /> : <FileSpreadsheet className="h-5 w-5 text-neutral-500" />}
        </div>
        <p className="mt-4 text-sm font-medium text-neutral-900">
          {loading ? "Importing products…" : "Drag and drop your stock list CSV here"}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          Each row becomes a product with price, stock quantity, and optional warehouse column
        </p>
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          Choose CSV file
        </button>
      </div>

      <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void importFile(e.target.files?.[0] ?? null)} />

      {result ? (
        <div className={cn("rounded-lg border px-4 py-3 text-sm", result.errors.length && !result.success ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900")}>
          <div className="flex items-start gap-2">
            {result.errors.length && !result.success ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <div>
              <p className="font-semibold">{result.success} product{result.success === 1 ? "" : "s"} added to your catalog</p>
              {result.errors.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700">
                  {result.errors.slice(0, 5).map((err) => <li key={err}>{err}</li>)}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (embedded) {
    return (
      <Panel
        title="Import stock list"
        description="Upload a CSV to bulk-add products with prices and inventory quantities."
        action={
          <BtnSecondary onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Template
          </BtnSecondary>
        }
        clip
      >
        {body}
      </Panel>
    );
  }

  return (
    <Panel
      title="Import stock list"
      description="Bulk-add products from a CSV file."
      action={
        <BtnSecondary onClick={downloadTemplate}>
          <Download className="h-4 w-4" />
          Download template
        </BtnSecondary>
      }
      clip
    >
      {body}
    </Panel>
  );
}
