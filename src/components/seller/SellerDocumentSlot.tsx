"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  getDocumentLabel,
  isDocumentRequired,
  type SellerDocumentRequirement,
  type SellerDocumentType,
} from "@/config/seller-document-requirements";
import type { SellerEntityType } from "@/config/seller-entity-types";
import type { SellerDocument } from "@/types/seller";

export function SellerDocumentSlot({
  sellerId,
  entityType,
  requirement,
  uploads,
  onUploaded,
}: {
  sellerId: string;
  entityType: SellerEntityType;
  requirement: SellerDocumentRequirement;
  uploads: SellerDocument[];
  onUploaded: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const required = isDocumentRequired(requirement.id, entityType);
  const uploaded = uploads.length > 0;

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("docType", requirement.id);
      body.append("sellerId", sellerId);
      const res = await fetch("/api/seller/documents/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className={`rounded-2xl border p-4 ${
        uploaded ? "border-emerald-200 bg-emerald-50/50" : "border-neutral-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-neutral-900">{requirement.label}</p>
            {required ? (
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                Required
              </span>
            ) : (
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                Optional
              </span>
            )}
            {uploaded ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
          </div>
          <p className="mt-1 text-sm text-neutral-600">{requirement.description}</p>
          {uploads.length ? (
            <ul className="mt-2 space-y-1">
              {uploads.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between gap-2 text-xs text-neutral-600">
                  <span className="truncate">{doc.fileName}</span>
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="shrink-0 text-brand hover:underline">
                    View
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploaded ? "Replace" : "Upload"}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
        onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
      />
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}

export function getDocumentSlotLabel(type: SellerDocumentType): string {
  return getDocumentLabel(type);
}
