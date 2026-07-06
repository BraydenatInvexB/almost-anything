"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SellerAdminActionsBar } from "@/components/admin/SellerAdminActionsBar";
import { SellerAdminOverviewTab } from "@/components/admin/SellerAdminOverviewTab";
import { SellerAdminProductsTab } from "@/components/admin/SellerAdminProductsTab";
import { SellerAdminMessagesTab } from "@/components/admin/SellerAdminMessagesTab";
import { SellerAdminPayoutsTab } from "@/components/admin/SellerAdminPayoutsTab";
import { SellerAdminDocumentsPanel } from "@/components/admin/SellerAdminDocumentsPanel";
import type { SellerDocument, SellerPayout, SellerProfile } from "@/types/seller";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "products", label: "Products" },
  { id: "messages", label: "Messages" },
  { id: "documents", label: "Documents" },
  { id: "payouts", label: "Payouts" },
] as const;

type SellerTab = (typeof TABS)[number]["id"];

export function SellerDetailShell({
  seller,
  documents,
  payouts,
  canManage,
  initialTab,
}: {
  seller: SellerProfile;
  documents: SellerDocument[];
  payouts: SellerPayout[];
  canManage: boolean;
  initialTab?: SellerTab;
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as SellerTab | null;
  const defaultTab = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : initialTab ?? "overview";
  const [tab, setTab] = useState<SellerTab>(defaultTab);
  const [status, setStatus] = useState(seller.status);
  const [documentRows, setDocumentRows] = useState(documents);

  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  return (
    <div className="space-y-6">
      <Link href="/admin/sellers" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" />
        Back to sellers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{seller.shopName}</h1>
          <p className="text-neutral-600">{seller.companyName}</p>
        </div>
        <SellerAdminActionsBar
          seller={{ ...seller, status }}
          canManage={canManage}
          onStatusChange={setStatus}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "rounded-t-lg px-4 py-2 text-sm font-medium transition-colors",
              tab === item.id
                ? "border-b-2 border-brand text-brand"
                : "text-neutral-500 hover:text-neutral-900",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? <SellerAdminOverviewTab seller={seller} status={status} /> : null}
      {tab === "products" ? <SellerAdminProductsTab sellerId={seller.id} canManage={canManage} /> : null}
      {tab === "messages" ? <SellerAdminMessagesTab sellerId={seller.id} canManage={canManage} /> : null}
      {tab === "documents" ? (
        <SellerAdminDocumentsPanel
          seller={{ ...seller, status }}
          documents={documentRows}
          canManage={canManage}
          onUpdated={setDocumentRows}
        />
      ) : null}
      {tab === "payouts" ? (
        <SellerAdminPayoutsTab
          sellerId={seller.id}
          shopName={seller.shopName}
          payouts={payouts}
          canManage={canManage}
        />
      ) : null}
    </div>
  );
}
