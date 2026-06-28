import { Megaphone, Mail, Tag, Star } from "lucide-react";
import { getCurrentStaff, listAdminProducts, listCampaigns } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { CampaignManager } from "@/components/admin/CampaignManager";
import { PageHeader, StatCard, Panel } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import Image from "next/image";

export default async function AdminMarketingPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "marketing.view")) return <AccessDenied feature="marketing" />;

  const products = await listAdminProducts();
  const campaigns = listCampaigns();
  const featured = products.filter((p) => p.is_featured).slice(0, 6);
  const deals = products.filter((p) => p.is_deal);
  const liveCampaigns = campaigns.filter((c) => c.status === "live").length;

  return (
    <>
      <PageHeader
        title="Marketing & campaigns"
        subtitle="Create promotions, manage campaigns, featured products, and promo codes."
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Live campaigns" value={String(liveCampaigns)} icon={<Megaphone className="h-4 w-4" />} accent="bg-brand" />
        <StatCard label="Total campaigns" value={String(campaigns.length)} icon={<Mail className="h-4 w-4" />} accent="bg-neutral-950" />
        <StatCard label="Active deals" value={String(deals.length)} icon={<Tag className="h-4 w-4" />} accent="bg-emerald-500" />
        <StatCard label="Featured products" value={String(featured.length)} icon={<Star className="h-4 w-4" />} accent="bg-violet-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Campaigns" className="lg:col-span-2">
          <CampaignManager initial={campaigns} canManage={staffCan(staff, "marketing.manage")} />
        </Panel>

        <Panel title="Featured products">
          <div className="flex flex-col gap-3 p-5">
            {featured.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                {p.image_url && (
                  <Image src={p.image_url} alt={p.name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
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
