import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { SITE_CONFIG } from "@/config/site";

export default function TermsPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: June 27, 2026</p>
        <Card variant="elevated" className="mt-8 space-y-6 bg-white p-8 text-sm leading-relaxed text-neutral-600">
          <section>
            <h2 className="font-semibold text-neutral-900">Acceptance</h2>
            <p className="mt-2">By using {SITE_CONFIG.name}, you agree to these terms. If you do not agree, please do not use our services.</p>
          </section>
          <section>
            <h2 className="font-semibold text-neutral-900">Products & availability</h2>
            <p className="mt-2">We aim to keep pricing and availability accurate at all times. Prices and availability may change, and in rare cases an item may become unavailable after you order, in which case you&apos;ll be offered an alternative or a full refund.</p>
          </section>
          <section>
            <h2 className="font-semibold text-neutral-900">Payments</h2>
            <p className="mt-2">All prices are in South African Rand (ZAR) unless stated otherwise. Payment is collected at checkout. We begin processing your order once payment is confirmed.</p>
          </section>
          <section>
            <h2 className="font-semibold text-neutral-900">Contact</h2>
            <p className="mt-2">Questions about these terms? Email {SITE_CONFIG.supportEmail}.</p>
          </section>
        </Card>
        <Link href="/" className="mt-6 inline-block text-sm text-neutral-500 hover:text-neutral-900">← Back to store</Link>
      </main>
      <SiteFooter />
    </div>
  );
}
