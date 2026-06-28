import { getCurrentStaff, getSettings, isAdminLiveMode } from "@/services/admin-service";
import { can } from "@/config/rbac";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const staff = await getCurrentStaff();
  if (!staff || !can(staff.role, "settings.view")) return <AccessDenied feature="settings" />;

  const settings = await getSettings();
  const canManage = can(staff.role, "settings.manage");

  return (
    <>
      <PageHeader
        title="Platform Settings"
        subtitle="Control pricing, markup, shipping, and store-wide automation."
      />

      {!isAdminLiveMode() && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Demo mode: Supabase isn&apos;t configured, so changes won&apos;t persist. Add your Supabase
          keys to <code className="font-mono text-xs">.env.local</code> and run the migrations to go live.
        </div>
      )}

      <SettingsForm settings={settings} canManage={canManage} />
    </>
  );
}
