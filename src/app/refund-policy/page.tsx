import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { SITE_CONFIG } from "@/config/site";

export default function RefundPolicyPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">Refund Policy</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: June 28, 2026</p>
        <Card variant="elevated" className="mt-8 space-y-6 bg-white p-8 text-sm leading-relaxed text-neutral-600">
          <section>
            <h2 className="font-semibold text-neutral-900">30-day return window</h2>
            <p className="mt-2">
              Most items can be returned within 30 days of delivery for a full refund, provided they
              are unused and in original packaging. Some categories (personal care, custom orders)
              may be excluded — we&apos;ll confirm before you buy if that applies.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-neutral-900">How to request a refund</h2>
            <p className="mt-2">
              Start a return from your{" "}
              <Link href="/account/orders" className="text-brand hover:underline">
                order history
              </Link>
              , visit our{" "}
              <Link href="/help/returns" className="text-brand hover:underline">
                returns help page
              </Link>
              , or email {SITE_CONFIG.supportEmail} with your order number.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-neutral-900">Refund timing</h2>
            <p className="mt-2">
              Once we receive and inspect your return, refunds are processed within 5–7 business
              days to your original payment method. Bank processing times may add a few extra days.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-neutral-900">Shipping costs</h2>
            <p className="mt-2">
              If the return is due to our error (wrong item, damaged, or defective), we cover return
              shipping. For change-of-mind returns, return shipping may be deducted from your
              refund unless otherwise stated at checkout.
            </p>
          </section>
          <section>
            <h2 className="font-semibold text-neutral-900">Questions</h2>
            <p className="mt-2">
              Contact {SITE_CONFIG.supportEmail} or{" "}
              <Link href="/help" className="text-brand hover:underline">
                open a support ticket
              </Link>
              .
            </p>
          </section>
        </Card>
        <Link href="/" className="mt-6 inline-block text-sm text-neutral-500 hover:text-neutral-900">
          ← Back to store
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
