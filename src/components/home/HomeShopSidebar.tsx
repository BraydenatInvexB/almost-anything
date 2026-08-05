import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { HOME_CATEGORY_STRIP } from "@/config/home-marketplace";
import { SiteLogo } from "@/components/layout/SiteLogo";

export function HomeShopSidebar() {
  return (
    <aside className="home-marketplace-sidebar border-r border-neutral-100 bg-white p-4">
      <div className="flex h-full min-h-[760px] flex-col">
        <SiteLogo priority className="px-2 pb-8 pt-2" />
        <div className="mb-5 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">Shop</p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.035em] text-neutral-950">Categories</p>
        </div>
        <nav className="grid grid-cols-2 gap-x-3 gap-y-5">
          {HOME_CATEGORY_STRIP.map(({ label, href, icon: Icon, featured }) => (
            <Link
              key={label}
              href={href}
              className={`group flex min-w-0 flex-col items-center text-center transition-transform hover:-translate-y-0.5 ${featured ? "text-brand" : "text-neutral-700"}`}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${featured ? "border-[#f2d8da] bg-[#fff1f2] text-brand" : "border-neutral-100 bg-[#f7f7f6] text-neutral-600 group-hover:border-[#f2d8da] group-hover:bg-[#fff1f2] group-hover:text-brand"}`}>
                <Icon className="h-[19px] w-[19px]" strokeWidth={1.7} />
              </span>
              <span className="mt-2 line-clamp-2 text-[11px] font-medium leading-4">{label}</span>
            </Link>
          ))}
          <Link href="/products" className="group col-span-2 mt-1 flex items-center justify-center gap-3 rounded-full border border-dashed border-neutral-300 px-3 py-3 text-xs font-semibold text-neutral-700 transition-colors hover:border-brand hover:text-brand">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-white group-hover:bg-brand">
              <LayoutGrid className="h-3.5 w-3.5" />
            </span>
            <span>View all</span>
            <ChevronRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-brand" />
          </Link>
        </nav>
      </div>
    </aside>
  );
}
