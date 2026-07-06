"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface ProductImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ProductImageGallery({ images, alt, className }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  if (!active) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center bg-neutral-100 text-sm text-neutral-400",
          className,
        )}
      >
        Photo from supplier listing
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <Image
          key={active}
          src={active}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-3"
          priority={activeIndex === 0}
          unoptimized={active.startsWith("http") && !active.includes("unsplash")}
        />
      </div>

      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, index) => (
            <button
              key={`${url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View photo ${index + 1}`}
              aria-pressed={index === activeIndex}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-neutral-50 transition-colors",
                index === activeIndex
                  ? "border-neutral-900"
                  : "border-neutral-200 hover:border-neutral-400",
              )}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
                unoptimized={url.startsWith("http") && !url.includes("unsplash")}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
