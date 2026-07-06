"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ImagePlus, Mic, MicOff, Search, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils/cn";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { readImageFile, storeSearchPhoto } from "@/lib/utils/search-photo";
import type { HeroShowcaseConfig } from "@/lib/admin/operations-types";
import { getHeroItems, HERO_STICKER_ROTATE, HERO_STICKER_STYLES } from "@/lib/hero/showcase-styles";

interface BoldHeroProps {
  showcase: HeroShowcaseConfig;
}

export function BoldHero({ showcase }: BoldHeroProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [searchHint, setSearchHint] = useState("");
  const { supported: voiceSupported, listening, error: voiceError, start, stop, clearError } =
    useSpeechRecognition();

  const carousel = useMemo(() => {
    const valid = getHeroItems(showcase);
    return valid.length > 0 ? valid : showcase.items;
  }, [showcase]);

  useEffect(() => {
    if (!carousel.length) return;
    const full = carousel[idx % carousel.length].searchQuery;
    let char = 0;
    const typer = setInterval(() => {
      char += 1;
      setTyped(full.slice(0, char));
      if (char >= full.length) clearInterval(typer);
    }, 55);
    const advance = setTimeout(() => setIdx((i) => (i + 1) % carousel.length), 4200);
    return () => {
      clearInterval(typer);
      clearTimeout(advance);
    };
  }, [idx, carousel]);

  const item = carousel[idx % carousel.length];

  function clearPhoto() {
    setPhotoPreview(null);
    setPhotoName("");
    setPhotoError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePhotoSelect(file: File | null) {
    if (!file) return;
    setPhotoError("");
    try {
      const dataUrl = await readImageFile(file);
      setPhotoPreview(dataUrl);
      setPhotoName(file.name);
      setSearchHint("Photo attached — add a note or tap Find it to send.");
    } catch (err) {
      clearPhoto();
      setPhotoError(err instanceof Error ? err.message : "Couldn't use that photo.");
    }
  }

  function toggleVoice() {
    clearError();
    setSearchHint("");
    if (listening) {
      stop();
      return;
    }
    setSearchHint("Listening… say what you're looking for.");
    start((transcript, isFinal) => {
      setValue(transcript);
      if (isFinal && transcript) {
        setSearchHint("");
        stop();
      }
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();

    if (photoPreview) {
      storeSearchPhoto({ dataUrl: photoPreview, name: photoName || "upload.jpg" });
      const params = new URLSearchParams({ from: "photo" });
      if (trimmed) params.set("q", trimmed);
      router.push(`/request?${params.toString()}`);
      return;
    }

    if (trimmed) router.push(`/products?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <section className="overflow-hidden rounded-[28px] border-[3px] border-black bg-white shadow-[7px_7px_0_0_#000]">
      <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_1fr]">
        {/* Left — the ask */}
        <div className="px-6 py-10 sm:px-10 sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white px-3 py-1 text-xs font-extrabold uppercase tracking-wide">
            <span className="h-2 w-2 rounded-full bg-brand ring-1 ring-black" />
            Almost anything store
          </span>

          <h1 className="mt-6 text-5xl font-black uppercase leading-[0.92] tracking-tight text-black sm:text-7xl">
            Name it.
            <br />
            We&apos;ve{" "}
            <span className="inline-block -rotate-1 bg-brand px-2 text-white ring-2 ring-black">
              got it.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-base font-medium leading-relaxed text-neutral-600">
            Type anything you can dream up. See one honest price, tap buy, and
            we&apos;ll land it on your doorstep. No tabs, no hunting.
          </p>

          {/* Search */}
          <form onSubmit={submit} className="mt-7 max-w-xl">
            <div className="flex items-center gap-1.5 rounded-2xl border-[3px] border-black bg-white p-1.5 pl-4 shadow-[4px_4px_0_0_#000] transition-all focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-[6px_6px_0_0_#000] sm:gap-2">
              <Search className="hidden h-5 w-5 shrink-0 text-black sm:block" />
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Try 'air fryer', 'PS5', 'leather jacket'..."
                aria-label="Search for anything"
                className="h-11 min-w-0 flex-1 bg-transparent text-[15px] font-medium text-black outline-none placeholder:text-neutral-400"
              />

              {photoPreview ? (
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border-2 border-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Uploaded search reference" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-black bg-white text-black"
                    aria-label="Remove photo"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => void handlePhotoSelect(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black bg-white text-black transition-colors hover:bg-neutral-100"
                    aria-label="Upload a photo of what you're looking for"
                    title="Upload a photo"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={toggleVoice}
                disabled={!voiceSupported}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-black transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  listening
                    ? "animate-pulse bg-brand text-white"
                    : "bg-white text-black hover:bg-neutral-100"
                }`}
                aria-label={listening ? "Stop listening" : "Search by voice"}
                title={voiceSupported ? "Search by voice" : "Voice search not supported in this browser"}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <button
                type="submit"
                disabled={!value.trim() && !photoPreview}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border-2 border-black bg-black px-4 text-sm font-extrabold uppercase text-white transition-colors hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
              >
                Find it
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {(searchHint || voiceError || photoError) && (
              <p
                className={`mt-2 text-xs font-semibold ${
                  voiceError || photoError ? "text-red-600" : "text-neutral-500"
                }`}
              >
                {voiceError || photoError || searchHint}
              </p>
            )}
          </form>

          {/* Sticker badges */}
          <div className="mt-7 flex flex-wrap gap-3">
            {showcase.stickers.map((s) => (
              <span
                key={s.id}
                className={`${HERO_STICKER_STYLES[s.color]} ${HERO_STICKER_ROTATE[s.rotate]} inline-flex items-center rounded-full border-2 border-black px-3.5 py-1.5 text-xs font-extrabold uppercase shadow-[3px_3px_0_0_#000]`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right — the magic moment */}
        <div className="relative flex flex-col justify-center gap-4 border-t-[3px] border-black bg-brand px-6 py-10 text-white sm:px-8 lg:border-l-[3px] lg:border-t-0">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            {showcase.panelLabel}
          </div>

          {/* Faux query */}
          <div className="flex items-center gap-2.5 rounded-xl border-2 border-black bg-white px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-black" />
            <span className="text-sm font-semibold text-black">
              {typed}
              <span className="ml-0.5 inline-block h-4 w-0.5 -translate-y-0.5 animate-pulse bg-black align-middle" />
            </span>
          </div>

          {/* Result sticker card */}
          <div
            key={idx}
            className="animate-word-in -rotate-1 rounded-2xl border-[3px] border-black bg-white p-4 shadow-[5px_5px_0_0_#000]"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-black bg-neutral-100">
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="96px" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-black bg-black px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                  <Check className="h-3 w-3" /> {item.stockLabel ?? (item.inStock ? "In stock" : "On order")}
                </span>
                <p className="mt-1.5 truncate text-sm font-extrabold text-black">{item.name}</p>
                <p className="text-2xl font-black text-black">
                  {formatCurrency(item.price, item.currency)}
                </p>
                <p className="text-xs font-semibold text-neutral-500">
                  Delivered in {item.deliveryDays} days
                </p>
              </div>
            </div>
            <Link
              href={
                item.productSlug
                  ? `/products/${item.productSlug}`
                  : `/products?q=${encodeURIComponent(item.searchQuery)}`
              }
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-black bg-black py-2.5 text-xs font-extrabold uppercase text-white transition-colors hover:bg-brand hover:text-white"
            >
              {showcase.buyButtonLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
