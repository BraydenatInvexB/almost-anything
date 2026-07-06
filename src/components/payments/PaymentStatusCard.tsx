import type { ReactNode } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function PaymentStatusCard({
  icon,
  title,
  description,
  reference,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  reference?: string | null;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 sm:px-6">
        <Card variant="elevated" className="bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
            {icon}
          </div>
          <h1 className="mt-6 text-2xl font-bold text-neutral-900">{title}</h1>
          <p className="mt-2 text-sm text-neutral-600">{description}</p>
          {reference ? (
            <p className="mt-4 font-mono text-xs text-neutral-400">Ref: {reference}</p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={primaryHref}>
              <Button className="w-full rounded-full sm:w-auto">{primaryLabel}</Button>
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link href={secondaryHref}>
                <Button variant="secondary" className="w-full rounded-full sm:w-auto">
                  {secondaryLabel}
                </Button>
              </Link>
            ) : null}
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
