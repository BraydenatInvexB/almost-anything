import { Search, Tag, Truck } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Search for anything",
    body: "From everyday essentials to the hard to find. If you can name it, you can get it here.",
  },
  {
    icon: Tag,
    title: "See one honest price",
    body: "No endless tabs or comparing. One clear price, with delivery sorted, ready to check out.",
  },
  {
    icon: Truck,
    title: "Delivered to your door",
    body: "Pay securely and relax. Track your order every step of the way until it arrives.",
  },
];

export function HowItWorks() {
  return (
    <section className="rounded-[28px] border border-neutral-200 bg-white p-6 sm:p-10">
      <div className="mx-auto mb-8 max-w-xl text-center">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          A simpler way to shop
        </span>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          Everything you want, without the hassle
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="relative rounded-3xl border border-neutral-100 bg-neutral-50/60 p-6"
          >
            <span className="absolute right-5 top-5 text-sm font-bold text-neutral-300">
              0{i + 1}
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand">
              <step.icon className="h-5 w-5 text-neutral-900" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-neutral-900">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-500">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
