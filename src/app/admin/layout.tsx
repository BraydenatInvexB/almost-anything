import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentStaff, isAdminLiveMode, listTickets } from "@/services/admin-service";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin Console",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (pathname.startsWith("/admin/login")) {
    return children;
  }

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
