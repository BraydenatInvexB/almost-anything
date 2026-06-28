import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { SupportContactForm } from "@/components/support/SupportContactForm";

const TOPICS = [
  { title: "Placing an order", href: "/help", body: "Browse products or request a specific item, add to cart, and check out." },
  { title: "Shipping & delivery", href: "/help/shipping", body: "The Courier Guy, Fastway, and Aramex. Delivery is included in your price." },
  { title: "Track your order", href: "/track", body: "Enter your order number any time to see exactly where your package is." },
  { title: "Returns & refunds", href: "/help/returns", body: "30 day return policy on most items. Submit a ticket below to start a return." },
];

export default function HelpPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">Help Center</h1>
        <p className="mt-2 text-neutral-500">Everything you need to shop with confidence.</p>

        <div className="mt-8">
          <SupportContactForm />
        </div>

        <div className="mt-8 space-y-4">
          {TOPICS.map((topic) => (
            <Link key={topic.href + topic.title} href={topic.href}>
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
