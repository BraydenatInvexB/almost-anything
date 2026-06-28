"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const PLACEHOLDERS = [
  "wireless earbuds",
  "a standing desk",
  "an espresso machine",
  "running shoes",
  "a 4K monitor",
  "a cozy reading chair",
];

const SUGGESTIONS = [
  "Headphones",
  "Standing desk",
  "Coffee machine",
  "Sneakers",
  "Monitor",
  "Air fryer",
];

export function AskSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [phIndex, setPhIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhIndex((i) => (i + 1) % PLACEHOLDERS.length), 3000);
    return () => clearInterval(id);
  }, []);

  function go(q: string) {
    const trimmed = q.trim();
    router.push(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products");
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(query);
        }}
        className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1.5 pl-5 shadow-sm transition-shadow focus-within:border-neutral-300 focus-within:shadow-md"
      >
        <Search className="h-5 w-5 shrink-0 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search for ${PLACEHOLDERS[phIndex]}`}
          aria-label="Search products"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-neutral-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-neutral-400">Popular:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go(s)}
            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
