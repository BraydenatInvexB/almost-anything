import { redirect } from "next/navigation";
import { getCurrentStaff, isAdminLiveMode } from "@/services/admin-service";
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
  const staff = await getCurrentStaff();

  // In live (Supabase) mode, non-staff are bounced out. In demo mode the
  // service returns the platform owner so the console is reviewable locally.
  if (!staff) {
    if (isAdminLiveMode()) {
      redirect("/login?redirect=/admin&reason=staff-only");
    }
    redirect("/login");
  }

  return <AdminShell staff={staff}>{children}</AdminShell>;
}
