import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { cn } from "@/lib/utils/cn";

interface SiteLogoProps {
  /** Compact mark + wordmark for headers; full includes tagline. */
  variant?: "compact" | "full";
  /** Large for homepage hero header; default for sticky inner pages. */
  size?: "default" | "large";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

const COMPACT_SIZES = {
  default: "h-14 w-auto sm:h-[4.25rem] lg:h-20",
  large: "h-[4.5rem] w-auto sm:h-24 lg:h-28",
} as const;

const FULL_SIZES = "h-20 w-auto sm:h-24 lg:h-28";

export function SiteLogo({
  variant = "compact",
  size = "default",
  className,
  imageClassName,
  priority = false,
}: SiteLogoProps) {
  const src = variant === "full" ? SITE_CONFIG.logoFull : SITE_CONFIG.logo;

  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src={src}
        alt={SITE_CONFIG.name}
        width={variant === "full" ? 560 : 480}
        height={variant === "full" ? 180 : 120}
        priority={priority}
        className={cn(
          "object-contain object-left",
          variant === "full" ? FULL_SIZES : COMPACT_SIZES[size],
          imageClassName,
        )}
      />
    </Link>
  );
}
