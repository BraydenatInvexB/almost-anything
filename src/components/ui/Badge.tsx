import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "exclusive" | "rating" | "deal";
  className?: string;
}

const variantStyles = {
  default: "bg-neutral-100 text-neutral-700",
  exclusive: "bg-brand-soft text-brand uppercase tracking-wider text-[10px]",
  rating: "bg-neutral-100 text-neutral-800",
  deal: "bg-brand text-white",
};

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
