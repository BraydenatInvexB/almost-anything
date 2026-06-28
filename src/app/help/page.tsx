import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";

const TOPICS = [
  { title: "Placing an order", href: "/help", body: "Browse products or request a specific item, add to cart, and check out." },
  { title: "Shipping & delivery", href: "/help/shipping", body: "Most items ship within 3–7 business days, fully tracked to your door." },
  { title: "Track your order", href: "/track", body: "Enter your order number any time to see exactly where your package is." },
  { title: "Returns & refunds", href: "/help/returns", body: "30-day return policy on most items. Contact support to initiate a return." },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#F4EEE1]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">Help Center</h1>
        <p className="mt-2 text-neutral-500">Everything you need to shop with confidence.</p>
        <div className="mt-8 space-y-4">
          {TOPICS.map((topic) => (
            <Link key={topic.href} href={topic.href}>
              <Card variant="elevated" className="bg-white p-6 transition-shadow hover:shadow-md">
                <h2 className="font-semibold text-neutral-900">{topic.title}</h2>
                <p className="mt-2 text-sm text-neutral-500">{topic.body}</p>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
