import { getCurrentStaff, getAnalytics } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { AnalyticsConsole } from "@/components/admin/AnalyticsConsole";

export default async function AdminAnalyticsPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "analytics.view")) return <AccessDenied feature="analytics" />;

  const analytics = await getAnalytics();

  return (
    <>
      <PageHeader
        title="Site analytics"
        subtitle="Interactive traffic, conversion, and page performance from storefront visits."
      />
      <AnalyticsConsole analytics={analytics} />
    </>
  );
}
