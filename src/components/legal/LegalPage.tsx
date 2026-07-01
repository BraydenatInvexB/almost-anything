import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";

export function LegalPage({
  title,
  lastUpdated,
  sections,
}: {
  title: string;
  lastUpdated: string;
  sections: { heading: string; text: string }[];
}) {
  return (
    <div className="flex min-h-full flex-col bg-white">
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
        <Link href="/" className="mt-6 inline-block text-sm text-neutral-500 hover:text-neutral-900">
          ← Back to store
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
