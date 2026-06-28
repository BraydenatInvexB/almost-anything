"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Check, Truck, ShieldCheck, Zap } from "lucide-react";
import { formatCurrency } from "@/lib/utils/cn";
import { AskSearch } from "@/components/home/AskSearch";

const IMG = (id: string) => `https://images.unsplash.com/${id}?w=600&h=600&fit=crop`;

const DESIRES = [
  { q: "louis vuitton neverfull", name: "Louis Vuitton Neverfull MM", price: 11400, days: "3 to 5", img: IMG("photo-1584917865442-de89df76afd3") },
  { q: "playstation 5 console", name: "PlayStation 5 Console", price: 8999, days: "2 to 4", img: IMG("photo-1606813907291-d86efa9b94db") },
  { q: "nike air max sneakers", name: "Nike Air Max", price: 2499, days: "3 to 6", img: IMG("photo-1542291026-7eec264c27ff") },
  { q: "tag heuer carrera watch", name: "Tag Heuer Carrera", price: 42000, days: "4 to 7", img: IMG("photo-1524592094714-0f0654e20314") },
  { q: "nespresso coffee machine", name: "Nespresso Vertuo", price: 3200, days: "2 to 4", img: IMG("photo-1517668808822-9ebb02f2a0e6") },
  { q: "ray-ban wayfarer", name: "Ray-Ban Wayfarer", price: 2150, days: "2 to 5", img: IMG("photo-1511499767150-a48a237f0083") },
];

export function AskHero() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");

  // Typewriter for the faux query, then reveal the result, then advance.
  useEffect(() => {
    const full = DESIRES[idx].q;
    let char = 0;
    const typer = setInterval(() => {
      char += 1;
      setTyped(full.slice(0, char));
      if (char >= full.length) clearInterval(typer);
    }, 55);
    const advance = setTimeout(() => setIdx((i) => (i + 1) % DESIRES.length), 4200);
    return () => {
      clearInterval(typer);
      clearTimeout(advance);
    };
  }, [idx]);

  const item = DESIRES[idx];

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_12px_50px_-24px_rgba(0,0,0,0.25)]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/12 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />

      <div className="relative grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        {/* Left: the ask */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3.5 py-1.5 text-xs font-medium text-neutral-600">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Almost anything. One simple price.
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.04] tracking-tight text-neutral-900 sm:text-6xl">
            If you can name it,
            <br />
            <span className="text-brand">we have it.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-neutral-500">
            Skip the endless tabs and price comparisons. Tell us what you want,
            see one honest price, and we deliver it straight to your door.
          </p>

          <div className="mt-8 max-w-xl">
            <AskSearch />
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-brand" /> Instant pricing
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-brand" /> Delivered to you
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand" /> Secure checkout
            </span>
          </div>
        </div>

        {/* Right: the magic moment */}
        <div className="relative flex flex-col justify-center gap-4 border-t border-neutral-200 bg-linear-to-br from-[#f4f7ec] via-neutral-50 to-[#eef4fb] px-6 py-10 sm:px-8 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            What shoppers are getting right now
          </div>

          {/* Faux search field typing a desire */}
          <div className="flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white px-4 py-3 shadow-sm">
            <Search className="h-4 w-4 shrink-0 text-neutral-400" />
            <span className="text-sm text-neutral-700">
              {typed}
              <span className="ml-0.5 inline-block h-4 w-0.5 -translate-y-0.5 animate-pulse bg-neutral-400 align-middle" />
            </span>
          </div>

          {/* Result card */}
          <div key={idx} className="animate-word-in flex items-center gap-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
              <Image src={item.img} alt={item.name} fill className="object-cover" sizes="96px" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <Check className="h-3.5 w-3.5" /> In stock
              </div>
              <p className="mt-1 truncate text-sm font-bold text-neutral-900">{item.name}</p>
              <p className="text-lg font-extrabold text-neutral-900">
                {formatCurrency(item.price)}
              </p>
              <p className="text-xs text-neutral-400">Delivered in {item.days} days</p>
            </div>
            <Link
              href={`/products?q=${encodeURIComponent(item.q)}`}
              className="hidden shrink-0 items-center rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800 sm:inline-flex"
            >
              Buy now
            </Link>
          </div>

          <p className="text-center text-xs text-neutral-400">
            Designer, tech, home and more, if it exists, just ask.
          </p>
        </div>
      </div>
    </section>
  );
}
