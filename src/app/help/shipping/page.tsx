import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";

export default function ShippingHelpPage() {
  return (
    <HelpArticle
      title="Shipping & Delivery"
      sections={[
        { heading: "Processing", text: "After you place an order, we prepare your item for dispatch. This typically takes 1–3 business days." },
        { heading: "Delivery windows", text: "Standard delivery is 3–7 business days depending on your location. Express options are available at checkout on select items." },
        { heading: "Tracking", text: "You'll receive a tracking number by email once your order ships. Track your package anytime from the Track Order page or your account order history." },
        { heading: "Free shipping", text: "Orders over R1,000 qualify for free standard shipping nationwide." },
      ]}
    />
  );
}

function HelpArticle({
  title,
  sections,
}: {
  title: string;
  sections: { heading: string; text: string }[];
}) {
  return (
    <div className="flex min-h-full flex-col bg-[#F4EEE1]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">← Help Center</Link>
        <h1 className="mt-4 text-3xl font-bold text-neutral-900">{title}</h1>
        <Card variant="elevated" className="mt-8 space-y-6 bg-white p-8">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="font-semibold text-neutral-900">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.text}</p>
            </div>
          ))}
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
