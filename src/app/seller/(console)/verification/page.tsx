import { getCurrentSeller, listSellerDocuments } from "@/services/seller-service";
import { evaluateSellerAccess } from "@/lib/seller/seller-access";
import { SellerVerificationView } from "@/components/seller/SellerVerificationView";

export default async function SellerVerificationPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const documents = await listSellerDocuments(seller.id);
  const access = evaluateSellerAccess(seller, documents);

  return <SellerVerificationView seller={seller} access={access} />;
}
