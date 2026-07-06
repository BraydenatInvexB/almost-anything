"use client";

import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  documentsByCategory,
  getCategoryLabel,
  SELLER_DOCUMENT_CATEGORIES,
} from "@/config/seller-document-requirements";
import { evaluateSellerDocumentCompliance, formatMissingDocuments, groupDocumentsByType } from "@/lib/seller/document-compliance";
import { SellerDocumentSlot } from "@/components/seller/SellerDocumentSlot";
import type { SellerEntityType } from "@/config/seller-entity-types";
import type { SellerDocument } from "@/types/seller";

export function SellerDocumentsPanel({
  sellerId,
  entityType,
  documents,
  onboarding,
}: {
  sellerId: string;
  entityType: SellerEntityType;
  documents: SellerDocument[];
  onboarding?: boolean;
}) {
  const router = useRouter();
  const grouped = groupDocumentsByType(documents);
  const compliance = evaluateSellerDocumentCompliance(entityType, documents);
  const byCategory = documentsByCategory(entityType);

  function refresh() {
    router.refresh();
  }

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5" />
            Verification documents
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Upload owner ID, proof of address, banking details, and entity-specific registration documents.
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 px-4 py-2 text-center">
          <p className="text-2xl font-bold text-neutral-900">{compliance.completionPercent}%</p>
          <p className="text-xs text-neutral-500">
            {compliance.uploadedRequiredCount}/{compliance.requiredCount} required
          </p>
        </div>
      </div>

      {onboarding ? (
        <p className="mt-4 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-neutral-800">
          Upload all required documents to unlock your seller dashboard. An admin will review and approve your
          application after submission.
        </p>
      ) : null}

      {!compliance.isComplete ? (
        <p className="mt-4 text-sm text-amber-700">
          Still needed: {formatMissingDocuments(compliance.missingRequired)}
        </p>
      ) : (
        <p className="mt-4 text-sm text-emerald-700">All required documents uploaded — verification in progress.</p>
      )}

      <div className="mt-6 space-y-8">
        {SELLER_DOCUMENT_CATEGORIES.map((category) => {
          const items = byCategory[category];
          if (!items.length) return null;

          return (
            <section key={category}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-500">
                {getCategoryLabel(category)}
              </h3>
              <div className="mt-3 space-y-3">
                {items.map((requirement) => (
                  <SellerDocumentSlot
                    key={requirement.id}
                    sellerId={sellerId}
                    entityType={entityType}
                    requirement={requirement}
                    uploads={grouped[requirement.id] ?? []}
                    onUploaded={refresh}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Card>
  );
}
