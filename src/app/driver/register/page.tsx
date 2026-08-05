import Link from "next/link";
import { Banknote, CarFront, CheckCircle2, Clock3, MapPin, PackageCheck } from "lucide-react";
import { DriverRegisterForm } from "@/components/driver/DriverRegisterForm";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { getPublicStorefrontConfig } from "@/services/storefront-settings-service";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function DriverRegisterPage() {
  await connection();
  const config = await getPublicStorefrontConfig();
  if (config.driverPortalEnabled === false) redirect("/");
  return (
    <main className="min-h-dvh bg-white text-neutral-900">
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <SiteLogo variant="compact" />
          <Link href="/driver/login" className="rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold hover:border-neutral-400">
            Driver sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-16 lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand">Deliver with Almost Anything</p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Your vehicle. Your province. More ways to earn.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
            Collect marketplace orders from local stores and deliver them safely to customers. Choose available jobs that suit your vehicle and schedule.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <EarningCard amount="R100" title="Standard delivery" copy="Every completed standard-size delivery." />
            <EarningCard amount="R200" title="Large-item delivery" copy="Every completed bulky or large-item delivery." featured />
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            <Benefit icon={Clock3} title="Work around your day" copy="Claim available delivery jobs when you are ready." />
            <Benefit icon={MapPin} title="Stay in your province" copy="See jobs assigned to the area you selected." />
            <Benefit icon={PackageCheck} title="Clear job information" copy="See the item size and delivery details before claiming." />
            <Benefit icon={Banknote} title="Simple delivery rates" copy="Know the delivery earning before you accept the job." />
          </div>

          <div className="mt-10 rounded-3xl bg-[#faf8f5] p-6">
            <p className="font-semibold">What you will need</p>
            <ul className="mt-4 grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
              {["A reliable vehicle", "A valid South African licence", "A smartphone with data", "Ability to handle items safely"].map((item) => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand" />{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="h-fit rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-[0_24px_70px_rgba(20,20,20,.08)] sm:p-8 lg:sticky lg:top-8">
          <div className="mb-7 flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-brand"><CarFront className="h-6 w-6" /></span>
            <div><h2 className="text-2xl font-bold tracking-tight">Apply to drive</h2><p className="mt-1 text-sm text-neutral-500">Create your driver account in a few minutes.</p></div>
          </div>
          <DriverRegisterForm showIntro={false} />
        </aside>
      </section>
    </main>
  );
}

function EarningCard({ amount, title, copy, featured = false }: { amount: string; title: string; copy: string; featured?: boolean }) {
  return <div className={`rounded-3xl p-6 ${featured ? "bg-brand text-white" : "border border-neutral-200 bg-white"}`}>
    <p className={`text-sm font-medium ${featured ? "text-white/75" : "text-neutral-500"}`}>{title}</p>
    <p className="mt-2 text-4xl font-bold tracking-tight">{amount}</p>
    <p className={`mt-3 text-sm leading-6 ${featured ? "text-white/80" : "text-neutral-500"}`}>{copy}</p>
  </div>;
}

function Benefit({ icon: Icon, title, copy }: { icon: typeof Clock3; title: string; copy: string }) {
  return <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100"><Icon className="h-5 w-5" /></span><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-5 text-neutral-500">{copy}</p></div></div>;
}
