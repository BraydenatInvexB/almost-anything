import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col bg-[#F4EEE1]">
      <SiteHeader />
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-6xl font-bold text-neutral-200">404</p>
        <h1 className="mt-4 text-2xl font-bold text-neutral-900">Page not found</h1>
        <p className="mt-2 text-neutral-500">
          We couldn&apos;t find that page. Tell us what you&apos;re after, we&apos;ve
          probably got it.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary">Browse Products</Button>
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
