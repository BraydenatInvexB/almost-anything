import { getCurrentStaff, getSettings, getPlatformExtendedConfig, isAdminLiveMode } from "@/services/admin-service";
import { can, staffCan } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { SettingsConsole } from "@/components/admin/SettingsConsole";

export default async function AdminSettingsPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "settings.view")) return <AccessDenied feature="settings" />;

  const settings = await getSettings();
  const extendedConfig = await getPlatformExtendedConfig();
  const canManage = staffCan(staff, "settings.manage");

  return (
    <>
      <PageHeader
        title="Platform Settings"
        subtitle="Configure store identity, pricing, tax, courier partners, and automation."
        breadcrumbs={[
          { label: "Admin", href: "/admin" },
          { label: "Settings" },
        ]}
      />

      {!isAdminLiveMode() && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode: Supabase isn&apos;t configured, so changes won&apos;t persist. Add your Supabase
          keys to <code className="font-mono text-xs">.env.local</code> and run the migrations to go live.
        </div>
      )}

      <SettingsConsole settings={settings} canManage={canManage} extendedConfig={extendedConfig} />
    </>
  );
}
