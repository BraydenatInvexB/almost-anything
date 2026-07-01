import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { SITE_CONFIG } from "@/config/site";

export default function AboutPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">About Us</h1>
        <p className="mt-2 text-sm text-neutral-500">{SITE_CONFIG.tagline}</p>

        <Card variant="elevated" className="mt-8 space-y-8 bg-white p-8">
          <section>
            <h2 className="font-semibold text-neutral-900">Who we are</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {SITE_CONFIG.name} is a South African online store built for people who want choice
              without the hassle. We source quality products across electronics, home, fashion, and
              more — then bring them to you at fair prices with fast local fulfilment where
              possible.
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900">What we believe</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-600">
              <li>Transparent pricing — what you see is what you pay.</li>
              <li>Real products from verified suppliers, not catalogue filler.</li>
              <li>Support that actually responds when something goes wrong.</li>
              <li>If we don&apos;t stock it yet, you can request it and we&apos;ll try to find it.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900">How it works</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Browse our catalogue or search for something specific. When you check out, we
              confirm availability with our supplier network, process your payment securely, and
              ship to your door. Track your order anytime from our{" "}
              <Link href="/track" className="text-brand hover:underline">
                order tracking page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-semibold text-neutral-900">Get in touch</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Questions, feedback, or partnership enquiries? Email us at{" "}
              <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-brand hover:underline">
                {SITE_CONFIG.supportEmail}
              </a>{" "}
              or visit our{" "}
              <Link href="/help" className="text-brand hover:underline">
                Help Center
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
