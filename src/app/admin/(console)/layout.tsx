import { redirect } from "next/navigation";
import { getAdminNotificationSummary, getCurrentStaff, isAdminLiveMode } from "@/services/admin-service";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getCurrentStaff();

  if (!staff) {
    if (isAdminLiveMode()) {
      redirect("/admin/login?redirect=/admin");
    }
    redirect("/admin/login");
  }

  const notifications = await getAdminNotificationSummary(staff);

  return (
    <AdminShell staff={staff} notifications={notifications}>
      {children}
    </AdminShell>
  );
}
