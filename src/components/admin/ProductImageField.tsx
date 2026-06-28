"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Link2, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Mode = "upload" | "url";

interface ProductImageFieldProps {
  value: string;
  onChange: (url: string) => void;
}

export function ProductImageField({ value, onChange }: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File | null) {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/products/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }
      onChange(data.url);
      setMode("upload");
    } catch {
      setUploadError("Network error — try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="sm:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-neutral-600">Product photo</span>
        <div className="flex rounded-lg border border-neutral-200 p-0.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={cn(
              "rounded-md px-2.5 py-1 transition-colors",
              mode === "upload" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors",
              mode === "url" ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800",
            )}
          >
            <Link2 className="h-3 w-3" />
            URL
          </button>
        </div>
      </div>

      {mode === "upload" ? (
        <div className="mt-2 grid gap-3 sm:grid-cols-[140px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
            {value ? (
              <>
                <Image src={value} alt="Product preview" fill className="object-cover" sizes="140px" unoptimized />
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm hover:bg-white"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-neutral-400">
                <ImagePlus className="h-8 w-8" />
                <span className="mt-1 text-[10px] font-medium">No image</span>
              </div>
            )}
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              void handleFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              "flex min-h-[140px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
              dragOver ? "border-brand bg-brand/5" : "border-neutral-200 bg-neutral-50/50 hover:border-neutral-300",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            {uploading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
                <p className="mt-2 text-sm font-medium text-neutral-700">Uploading…</p>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-neutral-500" />
                <p className="mt-2 text-sm font-medium text-neutral-800">
                  Drag a photo here, or{" "}
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="font-semibold text-brand underline-offset-2 hover:underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="mt-1 text-xs text-neutral-400">JPG, PNG, WebP or GIF · max 5 MB</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <input
          className="input mt-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      )}

      {uploadError ? <p className="mt-2 text-xs font-medium text-red-600">{uploadError}</p> : null}
    </div>
  );
}
