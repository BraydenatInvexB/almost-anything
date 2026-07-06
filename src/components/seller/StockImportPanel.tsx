"use client";

import { useRef, useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { stockImportTemplate } from "@/lib/seller/stock-import-parser";

export function StockImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
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

  return (
    <Card variant="elevated" className="p-6">
      <h2 className="text-lg font-semibold">Import stock list</h2>
      <p className="mt-1 text-sm text-neutral-600">
        Upload a CSV with columns: name, sku, price, quantity, category, description, image_url.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4" />
          Download template
        </Button>
        <Button type="button" size="sm" disabled={loading} onClick={() => inputRef.current?.click()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload CSV
        </Button>
      </div>
      <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => void importFile(e.target.files?.[0] ?? null)} />
      {result ? (
        <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm">
          <p className="font-semibold text-emerald-700">{result.success} products imported</p>
          {result.errors.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-red-600">
              {result.errors.slice(0, 5).map((err) => <li key={err}>{err}</li>)}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
