import Link from "next/link";
import { Store, Truck, Upload, Users, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";
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
  { icon: CreditCard, title: "Your plan starts after your first sale", text: "You will not be charged before your first completed sale." },
];

export default function SellLandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-[#faf9f7]">
      <div className="mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6">
        <SiteHeader variant="home" />
      </div>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid overflow-hidden rounded-[2rem] border border-neutral-200 bg-white lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative overflow-hidden bg-brand px-6 py-12 text-white sm:px-10 sm:py-16 lg:px-14">
            <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[48px] border-white/10" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Sell on Almost Anything</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-6xl">
                Grow your business with a marketplace built for selling
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                Create your store, add products and manage customer orders from one professional seller dashboard.
              </p>

              <div className="mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                <div>
                  <p className="font-semibold">No charge before your first sale</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    Your selected monthly plan begins only after your first completed sale. You will not be charged while you set up your store.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/sell/register">
                  <Button className="rounded-full bg-white px-8 text-neutral-950 hover:bg-neutral-100">
                    Create seller account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/seller/login">
                  <Button variant="secondary" className="rounded-full border-white/25 bg-transparent px-8 text-white hover:bg-white/10">Seller sign in</Button>
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-[#f6edcf] p-6 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">Getting started</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">Open your store with confidence</h2>
            <ol className="mt-8 space-y-6">
              {[
                ["01", "Create your profile", "Tell us about your business and choose a plan."],
                ["02", "Build your catalogue", "Add products, pricing and available stock."],
                ["03", "Complete your first sale", "Your plan becomes active only after this point."],
              ].map(([number, title, text]) => (
                <li key={number} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-brand">{number}</span>
                  <div>
                    <p className="font-semibold text-neutral-950">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-neutral-600">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Seller tools</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-neutral-950">Everything you need to run your store</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="rounded-[1.5rem] border-neutral-200 bg-white p-6 shadow-none">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0f1] text-brand"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-5 font-semibold text-neutral-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
            </Card>
          ))}
          </div>
        </section>

        <section id="pricing" className="mt-14 scroll-mt-24 rounded-[2rem] bg-neutral-950 p-6 text-white sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/50">Pricing</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Choose the right plan for your catalogue</h2>
            </div>
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">Billing begins after your first sale</span>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {SELLER_PLANS.map((plan) => (
              <Card key={plan.id} className="rounded-[1.5rem] border-white/10 bg-white p-6 text-neutral-950 shadow-none">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{plan.name}</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">R{plan.priceMonthly}<span className="ml-1 text-sm font-normal text-neutral-500">per month</span></p>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{plan.description}</p>
                <p className="mt-5 border-t border-neutral-100 pt-4 text-xs font-semibold text-neutral-500">No payment before your first completed sale</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
