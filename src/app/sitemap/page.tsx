import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { NAV_CATEGORIES } from "@/config/site";

const PAGES = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/products" },
  { label: "Cart", href: "/cart" },
  { label: "Checkout", href: "/checkout" },
  { label: "Custom Request", href: "/request" },
  { label: "Favorites", href: "/favorites" },
  { label: "Account", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Help", href: "/help" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function SitemapPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">Sitemap</h1>
        <Card variant="elevated" className="mt-8 bg-white p-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-400">Pages</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {PAGES.map((page) => (
              <li key={page.href}>
                <Link href={page.href} className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline">
                  {page.label}
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-neutral-400">Categories</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {NAV_CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <Link href={`/products?category=${cat.slug}`} className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline">
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
