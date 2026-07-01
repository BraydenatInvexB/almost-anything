import Link from "next/link";
import { X } from "lucide-react";

interface ActiveFilterChipsProps {
  chips: { label: string; clearHref: string }[];
}

export function ActiveFilterChips({ chips }: ActiveFilterChipsProps) {
  if (!chips.length) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-neutral-500">Filters:</span>
      {chips.map((chip) => (
        <Link
          key={chip.label}
          href={chip.clearHref}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white py-1 pl-3 pr-2 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
        >
          {chip.label}
          <X className="h-3 w-3 text-neutral-400" aria-hidden />
          <span className="sr-only">Remove filter</span>
        </Link>
      ))}
    </div>
  );
}
