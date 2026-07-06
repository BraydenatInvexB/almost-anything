import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const LINKS = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/returns", label: "Returns" },
  { href: "/favorites", label: "Favorites" },
];

export function AccountSubNav({ current }: { current: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-neutral-100 pb-4">
      {LINKS.map((link) => {
        const active = link.exact ? current === link.href : current.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
