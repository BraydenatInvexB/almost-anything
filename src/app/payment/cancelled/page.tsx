import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function PaymentCancelledPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 sm:px-6">
        <Card variant="elevated" className="bg-white p-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Payment cancelled</h1>
          <p className="mt-2 text-sm text-neutral-600">
            You cancelled the Paystack payment. No charge was made — you can resume whenever you&apos;re ready.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/checkout">
              <Button className="w-full rounded-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                Back to checkout
              </Button>
            </Link>
            <Link href="/sell/register">
              <Button variant="secondary" className="w-full rounded-full sm:w-auto">
                Seller registration
              </Button>
            </Link>
          </div>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
