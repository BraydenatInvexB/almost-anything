import Image from "next/image";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { cn } from "@/lib/utils/cn";

interface SiteLogoProps {
  variant?: "compact" | "full";
  size?: "default" | "large";
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

export function SiteLogo({
  variant = "compact",
  size = "default",
  className,
  imageClassName,
  priority = false,
}: SiteLogoProps) {
  const full = variant === "full";

  return (
    <Link href="/" aria-label={SITE_CONFIG.name} className={cn("inline-flex shrink-0", className)}>
      <Image
        src={full ? SITE_CONFIG.logoFull : SITE_CONFIG.logo}
        alt={SITE_CONFIG.name}
        width={full ? 1080 : 980}
        height={full ? 650 : 500}
        priority={priority}
        className={cn(
          "object-contain object-left",
          full
            ? "h-auto w-48 sm:w-56"
            : size === "large"
              ? "h-16 w-auto sm:h-20"
              : "h-10 w-auto sm:h-12 lg:h-14",
          imageClassName,
        )}
      />
    </Link>
  );
}
