import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto overflow-y-visible">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap bg-neutral-50/80 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={cn("px-5 py-4 align-middle text-neutral-700", className)}>{children}</td>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</dl>;
}

export function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

export function Timeline({
  events,
}: {
  events: { label: string; at: string; note?: string }[];
}) {
  return (
    <ol className="relative space-y-4 border-l border-neutral-200 pl-5">
      {events.map((event, i) => (
        <li key={`${event.label}-${event.at}-${i}`} className="relative">
          <span className="absolute -left-[1.35rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand ring-2 ring-brand/20" />
          <p className="text-sm font-semibold text-neutral-900">{event.label}</p>
          <p className="text-xs text-neutral-500">
            {new Date(event.at).toLocaleString("en-ZA", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          {event.note && <p className="mt-1 text-xs text-neutral-600">{event.note}</p>}
        </li>
      ))}
    </ol>
  );
}
