import { redirect } from "next/navigation";

/** Legacy route — team management lives under HR. */
export default function AdminStaffPage() {
  redirect("/admin/hr");
}
