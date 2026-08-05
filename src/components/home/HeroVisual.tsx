import Image from "next/image";
import { Check, Globe2, MapPin, PackageCheck, Search, Truck } from "lucide-react";

const SOURCING_STEPS = [
  { icon: Search, label: "Searching 48 stores", detail: "Local retailers" },
  { icon: Globe2, label: "Checking suppliers", detail: "Global network" },
  { icon: PackageCheck, label: "Best match found", detail: "Price verified" },
] as const;

export function HeroVisual() {
  return (
    <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden border-t border-neutral-200 bg-white/55 px-5 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-12">
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/[0.07] blur-2xl" />
      <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-amber-100/60 blur-3xl" />

      <div className="relative w-full max-w-[610px]">
        <div className="absolute -left-5 top-14 hidden w-40 -rotate-6 rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_16px_40px_rgba(0,0,0,0.10)] sm:block">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=360&h=270&fit=crop"
              alt="Headphones found by Almost Anything"
              fill
              sizes="160px"
              className="object-cover"
            />
          </div>
          <p className="mt-2 truncate text-[10px] font-semibold text-neutral-900">Sony WH-1000XM5</p>
          <p className="mt-0.5 text-[9px] text-neutral-500">Best local match</p>
        </div>

        <div className="relative ml-auto w-[92%] overflow-hidden rounded-[1.6rem] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(25,25,25,0.12)] sm:w-[84%]">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
            <div>
              <p className="text-xs font-semibold text-neutral-950">Live product search</p>
              <p className="mt-0.5 text-[10px] text-neutral-500">Almost Anything sourcing engine</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </span>
          </div>

          <div className="p-5">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Search className="h-4 w-4 text-brand" />
                <span className="text-sm font-semibold text-neutral-900">
                  “Premium headphones with next-day delivery”
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-1">
              {SOURCING_STEPS.map(({ icon: Icon, label, detail }, index) => (
                <div key={label} className="flex items-center gap-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-neutral-900">{label}</p>
                    <p className="text-[10px] text-neutral-500">{detail}</p>
                  </div>
                  {index === 2 ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand/50" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-950 px-4 py-3.5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <Truck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[10px] text-neutral-400">Delivered to</p>
                  <p className="text-xs font-semibold">Johannesburg · Tomorrow</p>
                </div>
              </div>
              <span className="text-sm font-bold">R 6,999</span>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-6 right-3 hidden items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-[10px] font-semibold text-neutral-700 shadow-lg sm:flex">
          <MapPin className="h-3.5 w-3.5 text-brand" /> 1 clear delivered price
        </div>
      </div>
    </div>
  );
}
