import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { SITE_CONFIG } from "@/config/site";

export default function ReturnsHelpPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#F4EEE1]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <Link href="/help" className="text-sm text-neutral-500 hover:text-neutral-900">← Help Center</Link>
        <h1 className="mt-4 text-3xl font-bold text-neutral-900">Returns & Refunds</h1>
        <Card variant="elevated" className="mt-8 space-y-6 bg-white p-8 text-sm leading-relaxed text-neutral-600">
          <section>
            <h2 className="font-semibold text-neutral-900">30-day return window</h2>
            <p className="mt-2">Most items can be returned within 30 days of delivery for a full refund, provided they are unused and in original packaging.</p>
          </section>
          <section>
            <h2 className="font-semibold text-neutral-900">How to start a return</h2>
            <p className="mt-2">Email {SITE_CONFIG.supportEmail} with your order number and reason for return. Our team will send a prepaid label within 2 business days.</p>
          </section>
          <section>
            <h2 className="font-semibold text-neutral-900">Refund timing</h2>
            <p className="mt-2">Refunds are processed within 5–7 business days after we receive your return.</p>
          </section>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
