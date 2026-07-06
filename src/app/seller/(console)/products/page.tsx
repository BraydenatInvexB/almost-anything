import { SellerProductForm } from "@/components/seller/SellerProductForm";
import { listSellerProducts } from "@/services/seller/products";
import { getCurrentSeller } from "@/services/seller-service";
import { Card } from "@/components/ui/Card";

export default async function SellerProductsPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;
  const products = await listSellerProducts(seller.id);

  return (
    <div className="space-y-6">
      <SellerProductForm />
      <Card variant="elevated" className="overflow-hidden bg-white">
        <div className="border-b border-neutral-100 px-6 py-4">
          <h2 className="text-lg font-semibold">Your products ({products.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-neutral-50">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3">R{Number(product.retail_price).toFixed(2)}</td>
                  <td className="px-4 py-3">{product.stock_quantity}</td>
                  <td className="px-4 py-3">{product.listing_status ?? "published"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
