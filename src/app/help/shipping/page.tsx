import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import {
  INTERNATIONAL_WAREHOUSE_DELIVERY_DAYS,
  SA_WAREHOUSE_DELIVERY_DAYS,
  formatDeliveryWindow,
} from "@/config/delivery";

export default function ShippingHelpPage() {
  return (
    <HelpArticle
      title="Shipping & Delivery"
      sections={[
        { heading: "Processing", text: "After you place an order, we prepare your item for dispatch. This typically takes 1 to 3 business days." },
        {
          heading: "Delivery windows",
          text: `South Africa warehouse orders typically arrive in ${formatDeliveryWindow(SA_WAREHOUSE_DELIVERY_DAYS.min, SA_WAREHOUSE_DELIVERY_DAYS.max)} business days. International warehouse orders take ${formatDeliveryWindow(INTERNATIONAL_WAREHOUSE_DELIVERY_DAYS.min, INTERNATIONAL_WAREHOUSE_DELIVERY_DAYS.max)} business days after dispatch.`,
        },
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
    <div className="flex min-h-full flex-col bg-white">
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
