"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { shouldUseNextImage } from "@/lib/sourcing/product-image-url";
import { getCategory } from "@/config/categories";

type Props = {
  src: string;
  alt: string;
  category: string;
  name: string;
  sizes?: string;
  className?: string;
  priority?: boolean;
};

const DEFAULT_IMAGE_CLASS =
  "absolute inset-0 h-full w-full bg-white object-contain p-4 transition-transform duration-500 group-hover:scale-[1.03]";

export function ProductCardImage({
  src,
  alt,
  category,
  name,
  sizes = "(max-width: 640px) 50vw, 25vw",
  className,
  priority = false,
}: Props) {
  const [failed, setFailed] = useState(false);
  const categoryMeta = getCategory(category);
  const initial = (name?.trim()?.[0] ?? category?.[0] ?? "?").toUpperCase();
  const imageClass = className
    ? `absolute inset-0 h-full w-full ${className}`
    : DEFAULT_IMAGE_CLASS;

  if (!src || failed) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white"
        aria-hidden
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-lg font-bold text-neutral-300 shadow-sm">
          {initial}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          <ImageIcon className="h-3 w-3" strokeWidth={1.75} />
          No photo
        </span>
      </div>
    );
  }

  if (!shouldUseNextImage(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- supplier listing URLs are not in next/image allowlist
      <img
        src={src}
        alt={alt}
        className={imageClass}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={imageClass}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
