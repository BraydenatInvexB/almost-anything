"use client";

import { cn } from "@/lib/utils/cn";
import { STOREFRONT_SECTIONS, type StorefrontSectionFlags } from "@/config/storefront-sections";

interface StorefrontSectionTogglesProps {
  value: StorefrontSectionFlags;
  onChange: (next: StorefrontSectionFlags) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function StorefrontSectionToggles({
  value,
  onChange,
  disabled,
  compact,
}: StorefrontSectionTogglesProps) {
  function toggle(column: keyof StorefrontSectionFlags) {
    onChange({ ...value, [column]: !value[column] });
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {STOREFRONT_SECTIONS.map((section) => {
          const on = value[section.column];
          return (
            <button
              key={section.id}
              type="button"
              disabled={disabled}
              title={section.title}
              onClick={() => toggle(section.column)}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide transition",
                on
                  ? "bg-brand text-white"
                  : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {section.shortLabel}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {STOREFRONT_SECTIONS.map((section) => {
        const on = value[section.column];
        return (
          <label
            key={section.id}
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition",
              on ? "border-brand/30 bg-brand/5" : "border-neutral-200 bg-neutral-50/50",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={on}
                disabled={disabled}
                onChange={() => toggle(section.column)}
                className="rounded border-neutral-300"
              />
              <span className="text-sm font-semibold text-neutral-900">{section.title}</span>
            </span>
            <span className="text-[11px] leading-relaxed text-neutral-500">
              {section.id === "steals"
                ? "Homepage row + /products?deals=true"
                : section.kicker}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function flagsFromProduct(product: Partial<StorefrontSectionFlags>): StorefrontSectionFlags {
  return {
    show_in_hot: Boolean(product.show_in_hot),
    show_in_steals: Boolean(product.show_in_steals),
    show_in_fresh_drops: Boolean(product.show_in_fresh_drops),
  };
}
