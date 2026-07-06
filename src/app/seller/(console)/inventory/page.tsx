import { StockImportPanel } from "@/components/seller/StockImportPanel";
import { listSellerProducts } from "@/services/seller/products";
import { getCurrentSeller } from "@/services/seller-service";
import { Card } from "@/components/ui/Card";

export default async function SellerInventoryPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;
  const products = await listSellerProducts(seller.id);
  const lowStock = products.filter((p) => Number(p.stock_quantity) > 0 && Number(p.stock_quantity) <= 5);

  return (
    <div className="space-y-6">
      <StockImportPanel />
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Stock overview</h2>
        <p className="mt-1 text-sm text-neutral-600">{products.length} SKUs · {lowStock.length} low stock</p>
        <div className="mt-4 space-y-2">
          {products.slice(0, 20).map((product) => (
            <div key={product.id} className="flex items-center justify-between rounded-xl border border-neutral-100 px-4 py-3 text-sm">
              <span className="font-medium">{product.name}</span>
              <span className={Number(product.stock_quantity) <= 5 ? "font-semibold text-amber-600" : "text-neutral-600"}>
                {product.stock_quantity} in stock
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
