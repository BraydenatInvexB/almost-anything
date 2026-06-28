import Image from "next/image";
import { Megaphone, Mail, Tag, Star } from "lucide-react";
import { getCurrentStaff, listAdminProducts } from "@/services/admin-service";
import { can } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader, StatCard, Panel } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";

const CAMPAIGNS = [
  { name: "Summer Clearance", channel: "Email + Banner", status: "Live", reach: "12,480", ctr: "4.8%" },
  { name: "New Arrivals Drop", channel: "Email", status: "Scheduled", reach: "—", ctr: "—" },
  { name: "VIP Early Access", channel: "Push + Email", status: "Draft", reach: "—", ctr: "—" },
];

export default async function AdminMarketingPage() {
  const staff = await getCurrentStaff();
  if (!staff || !can(staff.role, "marketing.view")) return <AccessDenied feature="marketing" />;

  const products = await listAdminProducts();
  const featured = products.filter((p) => p.is_featured).slice(0, 6);
  const deals = products.filter((p) => p.is_deal);

  return (
    <>
      <PageHeader
        title="Marketing & Growth"
        subtitle="Run campaigns, manage promotions, and decide what gets the spotlight."
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Newsletter subscribers" value="8,412" change={6.2} icon={<Mail className="h-4 w-4" />} accent="bg-amber-500" />
        <StatCard label="Active deals" value={String(deals.length)} icon={<Tag className="h-4 w-4" />} accent="bg-emerald-500" />
        <StatCard label="Featured products" value={String(featured.length)} icon={<Star className="h-4 w-4" />} accent="bg-violet-500" />
        <StatCard label="Live campaigns" value="1" icon={<Megaphone className="h-4 w-4" />} accent="bg-neutral-900" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Campaigns" className="lg:col-span-2">
          <div className="flex flex-col divide-y divide-neutral-50">
            {CAMPAIGNS.map((c) => (
              <div key={c.name} className="flex items-center gap-4 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                  <Megaphone className="h-5 w-5 text-neutral-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900">{c.name}</p>
                  <p className="text-xs text-neutral-400">{c.channel}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">{c.reach}</p>
                  <p className="text-xs text-neutral-400">reach</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">{c.ctr}</p>
                  <p className="text-xs text-neutral-400">CTR</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    c.status === "Live"
                      ? "bg-emerald-100 text-emerald-700"
                      : c.status === "Scheduled"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Featured products">
          <div className="flex flex-col gap-3 p-5">
            {featured.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                {p.image_url && (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-neutral-400">
                    {formatCurrency(p.retail_price, p.currency)}
                    {p.is_deal && p.deal_discount_percent ? ` · ${p.deal_discount_percent}% off` : ""}
                  </p>
                </div>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
