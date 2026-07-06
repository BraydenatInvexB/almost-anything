import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function PaymentPageShell({
  backHref,
  backLabel,
  title,
  description,
  children,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
        <Link
          href={backHref}
          className="mb-6 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{description}</p>
            </div>
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
