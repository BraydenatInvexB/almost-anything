"use client";

import { useEffect, useState } from "react";
import { ImageIcon, X } from "lucide-react";
import { clearSearchPhoto, readSearchPhoto, type StoredSearchPhoto } from "@/lib/search/photo";

type Props = {
  /** Current catalog search query, if any. */
  searchQuery?: string;
};

/**
 * Shown when the shopper arrived via photo search — matches against the site catalog.
 */
export function SearchPhotoBanner({ searchQuery }: Props) {
  const [photo, setPhoto] = useState<StoredSearchPhoto | null>(null);

  useEffect(() => {
    setPhoto(readSearchPhoto());
  }, []);

  if (!photo) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.dataUrl} alt="Your search photo" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
            <ImageIcon className="h-4 w-4 shrink-0" />
            Searching our catalog for this
            {searchQuery ? (
              <span className="truncate font-normal text-neutral-500">· “{searchQuery}”</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            We match against products already on the site. Try different keywords if you don&apos;t
            see a match.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          clearSearchPhoto();
          setPhoto(null);
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
        aria-label="Dismiss photo"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
