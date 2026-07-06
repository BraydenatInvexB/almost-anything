"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SocialAuthButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon: ReactNode;
}

export function SocialAuthButton({
  label,
  onClick,
  disabled,
  loading,
  icon,
}: SocialAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-11 w-full items-center justify-center rounded-full border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition-colors",
        "hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <span className="inline-flex items-center gap-2.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
          ) : (
            icon
          )}
        </span>
        <span className="leading-tight">{label}</span>
      </span>
    </button>
  );
}
