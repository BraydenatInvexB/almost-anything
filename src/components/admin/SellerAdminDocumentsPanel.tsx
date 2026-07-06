"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  getApplicableDocuments,
  getDocumentLabel,
  isDocumentRequired,
} from "@/config/seller-document-requirements";
import {
  evaluateSellerDocumentCompliance,
  groupDocumentsByType,
} from "@/lib/seller/document-compliance";
import type { SellerDocument, SellerProfile } from "@/types/seller";

export function SellerAdminDocumentsPanel({
  seller,
  documents,
}: {
  seller: SellerProfile;
  documents: SellerDocument[];
}) {
  const grouped = groupDocumentsByType(documents);
  const compliance = evaluateSellerDocumentCompliance(seller.entityType, documents);
  const applicable = getApplicableDocuments(seller.entityType);

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Verification documents</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            compliance.isComplete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {compliance.uploadedRequiredCount}/{compliance.requiredCount} required uploaded
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {applicable.map((spec) => {
          const uploads = grouped[spec.id] ?? [];
          const required = isDocumentRequired(spec.id, seller.entityType);
          const done = uploads.length > 0;

          return (
            <li
              key={spec.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-3 text-sm"
            >
              <div className="flex items-start gap-2">
                {done ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" />
                )}
                <div>
                  <p className="font-medium">
                    {spec.label}
                    {required ? " *" : ""}
                  </p>
                  {uploads.length ? (
                    uploads.map((doc) => (
                      <p key={doc.id} className="text-neutral-500">
                        {doc.fileName} · {doc.status}
                      </p>
                    ))
                  ) : (
                    <p className="text-neutral-400">Not uploaded</p>
                  )}
                </div>
              </div>
              {uploads[0] ? (
                <a
                  href={uploads[0].fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-brand hover:underline"
                >
                  Open
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>

      {documents.filter((doc) => !applicable.some((spec) => spec.id === doc.docType)).length ? (
        <div className="mt-4 border-t border-neutral-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Other uploads</p>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600">
            {documents
              .filter((doc) => !applicable.some((spec) => spec.id === doc.docType))
              .map((doc) => (
                <li key={doc.id}>
                  {getDocumentLabel(doc.docType)} — {doc.fileName}
                </li>
              ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
