"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { ProductCardData } from "@/types";

const SOCIAL_ICONS = [
  {
    label: "Twitter/X",
    href: "https://twitter.com",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.16 2.25h6.977l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "TikTok",
    href: "https://tiktok.com",
    path: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5",
    isStroke: true,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
];

const FEATURES = [
  { num: "01", title: "Almost Everything", desc: "Thousands of products across home, tech, and more — all in one store." },
  { num: "02", title: "Great Prices, Fast Delivery", desc: "Fair prices on every item, shipped quickly to your door." },
];

interface HeroCardProps {
  product: ProductCardData;
}

export function HeroCard({ product }: HeroCardProps) {
  return (
    <div className="relative flex min-h-[440px] flex-col overflow-hidden rounded-[28px] bg-white p-7 shadow-sm lg:min-h-[480px]">
      {/* Badge */}
      <div className="mb-6 flex items-center gap-2 self-start rounded-full bg-neutral-100 px-3 py-1.5">
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-neutral-600" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        <span className="text-xs font-medium text-neutral-600">New arrivals daily</span>
      </div>

      {/* Two-column layout: text left, image right */}
      <div className="flex flex-1 items-start gap-6">
        {/* Left text column */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-neutral-900 lg:text-5xl">
            Almost
            <br />
            Anything.
          </h1>

          <div className="mt-6 flex flex-col gap-4">
            {FEATURES.map((f) => (
              <div key={f.num} className="flex items-start gap-3">
                <span className="shrink-0 text-xs font-bold text-neutral-300 mt-0.5">{f.num}</span>
                <div className="h-px w-8 bg-neutral-200 mt-2.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{f.title}</p>
                  <p className="text-xs leading-relaxed text-neutral-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="group flex items-center gap-2 rounded-full bg-[#CDFF00] px-5 py-2.5 text-sm font-semibold text-neutral-900 transition-all hover:scale-[1.03] hover:shadow-md"
            >
              Browse Products
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 transition-transform group-hover:rotate-45">
                <ArrowUpRight className="h-3 w-3 text-[#CDFF00]" />
              </span>
            </Link>
            <Link
              href="/products?sort=featured"
              className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:text-neutral-900"
            >
              Today&apos;s Deals
            </Link>
          </div>

          {/* Social links */}
          <div className="mt-7 flex items-center gap-4">
            <span className="text-xs text-neutral-400">Follow us on:</span>
            {SOCIAL_ICONS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="text-neutral-400 transition-colors hover:text-neutral-900"
              >
                <svg viewBox="0 0 24 24" fill={s.isStroke ? "none" : "currentColor"} stroke={s.isStroke ? "currentColor" : "none"} strokeWidth={s.isStroke ? 2 : 0} className="h-4 w-4">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Product image with floating dots */}
        <div className="relative hidden flex-1 items-center justify-center lg:flex">
          {/* Floating decoration dots */}
          <div className="animate-float-slow absolute left-4 top-8 h-4 w-4 rounded-full bg-[#CDFF00]" />
          <div className="animate-float absolute right-10 top-2 h-3 w-3 rounded-full bg-neutral-900" />
          <div className="animate-float-delay absolute bottom-12 left-8 h-2.5 w-2.5 rounded-full bg-neutral-300" />
          <div className="animate-float absolute bottom-4 right-4 h-3.5 w-3.5 rounded-full bg-[#CDFF00]/60" />
          <div className="animate-float-slow absolute right-0 top-1/3 h-2 w-2 rounded-full bg-neutral-900/40" />

          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={260}
              height={280}
              className="relative z-10 max-h-[260px] w-auto object-contain drop-shadow-xl"
            />
          ) : (
            <div className="relative z-10 flex h-56 w-56 items-center justify-center rounded-3xl bg-neutral-100">
              <span className="text-4xl">📦</span>
            </div>
          )}

          {/* Code/arrow indicator */}
          <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-neutral-600">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
