import { redirect } from "next/navigation";

/** Item requests are retired — send shoppers to the catalog. */
export default function RequestPage() {
  redirect("/products");
}
