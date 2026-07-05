import Image from "next/image";
import { ShieldCheck, Truck, Tag } from "lucide-react";
import { AVATARS } from "@/config/avatars";

const PERKS = [
  { icon: Truck, label: "Fast, tracked delivery on every order" },
  { icon: Tag, label: "Member only deals across all categories" },
  { icon: ShieldCheck, label: "Secure checkout & easy 30 day returns" },
];

export function SignupBrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-neutral-200 bg-linear-to-br from-neutral-50 to-[#eef3df] p-10 lg:flex">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)", opacity: 0.18 }}
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full"
        style={{ background: "radial-gradient(circle, #cbd5e1 0%, transparent 70%)", opacity: 0.4 }}
      />

      <div className="relative">
        <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Almost Anything
        </span>
        <h2 className="mt-8 text-3xl font-extrabold leading-tight text-neutral-900">
          The store that has
          <br />
          almost everything.
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-500">
          Create your free account to shop thousands of products, save favorites,
          and track every order in one place.
        </p>

        <ul className="mt-8 flex flex-col gap-3">
          {PERKS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-sm text-neutral-700">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15">
                <Icon className="h-4 w-4 text-brand" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-3">
        <div className="flex -space-x-3">
          {AVATARS.slice(0, 4).map((src) => (
            <Image
              key={src}
              src={src}
              alt="Member"
              width={40}
              height={40}
              sizes="40px"
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
            />
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          Join <span className="font-semibold text-neutral-900">50,000+</span> happy shoppers
        </p>
      </div>
    </aside>
  );
}
