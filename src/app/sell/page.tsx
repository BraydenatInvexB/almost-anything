import Link from "next/link";
import { Store, Truck, Upload, Users, CreditCard, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SELLER_PLANS } from "@/config/seller-plans";

const FEATURES = [
  { icon: Store, title: "Your own seller dashboard", text: "Manage products, inventory, orders, and promos in one place." },
  { icon: Upload, title: "Import stock lists", text: "Upload CSV stock sheets to add or update products in bulk." },
  { icon: Truck, title: "Ship to customers", text: "Fulfill orders yourself and add courier tracking for buyers." },
  { icon: Users, title: "Invite your team", text: "Add employees to help with inventory, orders, and support." },
  { icon: CreditCard, title: "Pay when you sell", text: "Simple monthly plans — billing only starts on your first sale." },
];

export default function SellLandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6">
        <SiteHeader variant="home" />
      </div>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-10 sm:px-6">
        <section className="rounded-3xl border-[3px] border-black bg-brand/10 px-6 py-12 sm:px-10">
          <p className="text-xs font-extrabold uppercase tracking-widest text-neutral-700">Sell on Almost Anything</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            Help your business sell online — without the complexity
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-neutral-700">
            List products, manage stock, ship orders, and grow your brand on our marketplace.
            Simple onboarding. Professional tools. Billing starts only when you make your first sale.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sell/register">
              <Button className="rounded-full px-8">
                Start selling
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/seller/login">
              <Button variant="secondary" className="rounded-full px-8">Seller sign in</Button>
            </Link>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title} variant="elevated" className="p-6">
              <Icon className="h-6 w-6 text-brand" />
              <h2 className="mt-3 font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-neutral-600">{text}</p>
            </Card>
          ))}
        </section>

        <section id="pricing" className="mt-12 scroll-mt-24">
          <h2 className="text-2xl font-bold">Simple, transparent pricing</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {SELLER_PLANS.map((plan) => (
              <Card key={plan.id} variant="elevated" className="p-6">
                <p className="font-bold uppercase tracking-wide text-brand">{plan.name}</p>
                <p className="mt-2 text-3xl font-extrabold">R{plan.priceMonthly}<span className="text-base font-normal">/mo</span></p>
                <p className="mt-3 text-sm text-neutral-600">{plan.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
