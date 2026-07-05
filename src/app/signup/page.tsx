"use client";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SignupBrandPanel } from "@/components/signup/SignupBrandPanel";
import { SignupFormPanel } from "@/components/signup/SignupFormPanel";

export default function SignupPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="grid w-full min-w-0 max-w-5xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_70px_-30px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_1fr]">
          <SignupBrandPanel />
          <SignupFormPanel />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
