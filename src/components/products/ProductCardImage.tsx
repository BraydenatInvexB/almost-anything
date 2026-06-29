"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  category: string;
  name: string;
  sizes?: string;
  className?: string;
};

export function ProductCardImage({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, 25vw",
  className = "object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]",
}: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-400">
        <ImageIcon className="h-8 w-8" strokeWidth={1.5} />
        <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wide">
          Photo from listing
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      onError={() => setFailed(true)}
    />
  );
}
