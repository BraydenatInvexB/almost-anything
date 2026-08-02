import { redirect } from "next/navigation";

/** Item requests are retired from the admin console. */
export default function AdminRequestDetailPage() {
  redirect("/admin");
}
