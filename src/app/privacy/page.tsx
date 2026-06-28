import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { SITE_CONFIG } from "@/config/site";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated="June 27, 2026"
      sections={[
        { heading: "Information we collect", text: "We collect information you provide at checkout (name, email, shipping address), account credentials, and browsing activity on our platform." },
        { heading: "How we use your data", text: "Your data is used to process orders, improve our service, send order updates, and (with consent) marketing communications." },
        { heading: "Third parties", text: "We share data with payment processors (Stripe), database hosting (Supabase), and shipping carriers only as needed to fulfill your order." },
        { heading: "Contact", text: `For privacy requests, contact ${SITE_CONFIG.supportEmail}.` },
      ]}
    />
  );
}

function LegalPage({
  title,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdated: string;
  sections: { heading: string; text: string }[];
}) {
  return (
    <div className="flex min-h-full flex-col bg-[#F4EEE1]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500">Last updated: {lastUpdated}</p>
        <Card variant="elevated" className="mt-8 space-y-6 bg-white p-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-semibold text-neutral-900">{s.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.text}</p>
            </section>
          ))}
        </Card>
        <Link href="/" className="mt-6 inline-block text-sm text-neutral-500 hover:text-neutral-900">← Back to store</Link>
      </main>
      <SiteFooter />
    </div>
  );
}

export { LegalPage };
