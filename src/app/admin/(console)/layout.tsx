import { redirect } from "next/navigation";
import { getCurrentStaff, isAdminLiveMode, listTickets } from "@/services/admin-service";
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

  const tickets = await listTickets();
  const alerts = tickets.filter(
    (t) => (t.status === "open" || t.status === "pending") && t.priority === "urgent",
  ).length;

  return (
    <AdminShell staff={staff} alerts={alerts}>
      {children}
    </AdminShell>
  );
}
