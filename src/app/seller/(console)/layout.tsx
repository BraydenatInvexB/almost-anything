import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentSeller, listSellerDocuments } from "@/services/seller-service";
import { SellerShell } from "@/components/seller/SellerShell";
import { evaluateSellerAccess, isSellerLockedPath } from "@/lib/seller/seller-access";

export default async function SellerConsoleLayout({ children }: { children: React.ReactNode }) {
  const seller = await getCurrentSeller();
  if (!seller) redirect("/seller/login");

  const documents = await listSellerDocuments(seller.id);
  const access = evaluateSellerAccess(seller, documents);
  const pathname = (await headers()).get("x-pathname") ?? "";

  if (!access.canUseDashboard && access.redirectTo && !isSellerLockedPath(pathname)) {
    redirect(access.redirectTo);
  }

  return (
    <SellerShell seller={seller} access={access}>
      {children}
    </SellerShell>
  );
}
