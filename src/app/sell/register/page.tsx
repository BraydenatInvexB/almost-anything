import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SellerRegisterForm } from "@/components/seller/SellerRegisterForm";

export default function SellRegisterPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6">
        <SiteHeader variant="page" />
      </div>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Seller application</p>
          <h1 className="mt-2 text-3xl font-bold">Register your business</h1>
          <p className="mt-2 text-neutral-600">
            Already have a seller account?{" "}
            <Link href="/seller/login" className="font-semibold text-brand hover:underline">
              Sign in to dashboard
            </Link>
          </p>
        </div>
        <SellerRegisterForm />
      </main>
      <SiteFooter />
    </div>
  );
}
