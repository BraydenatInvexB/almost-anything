import { getCurrentStaff } from "@/services/admin-service";
import { staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { SearchesConsole } from "@/components/admin/SearchesConsole";
import { getSearchAnalyticsSummary } from "@/services/search-analytics-service";

export default async function AdminSearchesPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "searches.view")) {
    return <AccessDenied feature="search intelligence" />;
  }

  const summary = await getSearchAnalyticsSummary(30);

  return (
    <>
      <PageHeader
        title="Searches"
        subtitle="What customers are looking for most. Use this to prioritise catalog expansion and sourcing."
      />
      <SearchesConsole initial={summary} />
    </>
  );
}
