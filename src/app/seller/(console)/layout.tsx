import { redirect } from "next/navigation";
import { getCurrentSeller } from "@/services/seller-service";
import { SellerShell } from "@/components/seller/SellerShell";

export default async function SellerConsoleLayout({ children }: { children: React.ReactNode }) {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/seller/login");
  return <SellerShell seller={seller}>{children}</SellerShell>;
}
