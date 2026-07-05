"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (/^AA\d/i.test(q) || /^\d{4}$/.test(q)) {
      router.push(`/admin/orders?q=${encodeURIComponent(q)}`);
      return;
    }
    if (q.includes("@")) {
      router.push(`/admin/customers?q=${encodeURIComponent(q)}`);
      return;
    }
    router.push(`/admin/products?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative min-w-0 flex-1 sm:max-w-lg">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search…"
        aria-label="Search orders, customers, and products"
        className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm placeholder:text-neutral-400 focus:border-brand/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/10"
      />
    </form>
  );
}
