import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "exclusive" | "rating" | "deal";
  className?: string;
}

const variantStyles = {
  default: "bg-white text-black",
  exclusive: "bg-[#C7A8FF] text-black uppercase tracking-wider text-[10px]",
  rating: "bg-white text-black",
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
        "inline-flex items-center gap-1 rounded-full border-2 border-black px-3 py-1 text-xs font-extrabold",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
