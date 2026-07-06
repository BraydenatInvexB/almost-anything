"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Package, Percent, TrendingUp, Warehouse } from "lucide-react";
import { StatCard } from "@/components/admin/ui";
import { formatCurrency } from "@/lib/utils/cn";
import { aggregateCatalogPricing } from "@/lib/seller/product-pricing";
import { getStockLevel, sumStockUnits } from "@/lib/seller/stock-status";
import { cn } from "@/lib/utils/cn";
import { SellerCatalogAddTab } from "@/components/seller/SellerCatalogAddTab";
import { SellerCatalogProductsTab } from "@/components/seller/SellerCatalogProductsTab";
import { SellerCatalogStockTab } from "@/components/seller/SellerCatalogStockTab";
import { StockImportPanel } from "@/components/seller/StockImportPanel";
import type { SellerCatalogProduct, SellerCatalogShipping, SellerCatalogTab } from "@/types/seller-catalog";

const TABS: { id: SellerCatalogTab; label: string }[] = [
  { id: "products", label: "Catalog" },
  { id: "stock", label: "Stock levels" },
  { id: "add", label: "Add product" },
  { id: "import", label: "Import stock list" },
];

export function SellerCatalogDesk({
  products: initialProducts,
  shipping,
  defaultTab = "products",
  canEdit,
  canManageStock,
}: {
  products: SellerCatalogProduct[];
  shipping: SellerCatalogShipping;
  defaultTab?: SellerCatalogTab;
  canEdit: boolean;
  canManageStock: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as SellerCatalogTab | null;
  const activeTab = TABS.some((t) => t.id === tabParam) ? tabParam! : defaultTab;
  const [products, setProducts] = useState(initialProducts);

  useEffect(() => setProducts(initialProducts), [initialProducts]);

  const stats = useMemo(() => {
    const pricing = aggregateCatalogPricing(products);
    const low = products.filter((p) => {
      const qty = Number(p.stock_quantity);
      return qty > 0 && qty <= 5;
    }).length;
    return { ...pricing, low, totalUnits: sumStockUnits(products) };
  }, [products]);

  function setTab(tab: SellerCatalogTab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Live listings" value={String(products.length)} icon={<Package className="h-4 w-4" />} accent="bg-brand" />
        <StatCard label="Avg markup" value={`${stats.avgMarkup}%`} icon={<Percent className="h-4 w-4" />} accent="bg-neutral-800" />
        <StatCard label="Catalog margin" value={formatCurrency(stats.totalMargin, "ZAR")} hint="Retail minus cost (per unit)" icon={<TrendingUp className="h-4 w-4" />} accent="bg-emerald-600" />
        <StatCard label="Units on hand" value={stats.totalUnits.toLocaleString()} hint={stats.low ? `${stats.low} low stock` : "Across all SKUs"} icon={<Warehouse className="h-4 w-4" />} accent="bg-amber-500" />
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200/80 bg-neutral-50 p-1">
        {TABS.map((tab) => {
          const count =
            tab.id === "products"
              ? products.length
              : tab.id === "stock"
                ? products.filter((p) => getStockLevel(Number(p.stock_quantity)) !== "healthy").length
                : undefined;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={(tab.id === "add" || tab.id === "import") && !canEdit}
              onClick={() => setTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                activeTab === tab.id ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-600 hover:text-neutral-900",
              )}
            >
              {tab.label}
              {count !== undefined && count > 0 ? (
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] tabular-nums text-neutral-500">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {activeTab === "products" ? (
        <SellerCatalogProductsTab products={products} shipping={shipping} onGoAdd={() => setTab("add")} onGoImport={() => setTab("import")} canEdit={canEdit} />
      ) : null}
      {activeTab === "stock" ? (
        <SellerCatalogStockTab
          products={products}
          canManage={canManageStock}
          onUpdated={(id, qty) => setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock_quantity: qty } : p)))}
        />
      ) : null}
      {activeTab === "add" && canEdit ? (
        <SellerCatalogAddTab
          shipping={shipping}
          onAdded={(product) => {
            setProducts((prev) => [product, ...prev]);
            setTab("products");
            router.refresh();
          }}
        />
      ) : null}
      {activeTab === "import" && canEdit ? (
        <StockImportPanel embedded onImported={() => { router.refresh(); setTab("stock"); }} />
      ) : null}
    </div>
  );
}
