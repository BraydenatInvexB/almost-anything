"use client";

import { useState } from "react";
import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getApplicableDocuments,
  getDocumentLabel,
  isDocumentRequired,
} from "@/config/seller-document-requirements";
import {
  evaluateRequiredDocumentsApproved,
  evaluateSellerDocumentCompliance,
  groupDocumentsByType,
} from "@/lib/seller/document-compliance";
import { sellerApprovalBlockReason } from "@/lib/seller/seller-access";
import type { SellerDocument, SellerProfile } from "@/types/seller";

function statusBadge(status: SellerDocument["status"]) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

export function SellerAdminDocumentsPanel({
  seller,
  documents,
  canManage,
  onUpdated,
}: {
  seller: SellerProfile;
  documents: SellerDocument[];
  canManage: boolean;
  onUpdated: (documents: SellerDocument[]) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const grouped = groupDocumentsByType(documents);
  const compliance = evaluateSellerDocumentCompliance(seller.entityType, documents);
  const approval = evaluateRequiredDocumentsApproved(seller.entityType, documents);
  const applicable = getApplicableDocuments(seller.entityType);
  const approveBlockReason = sellerApprovalBlockReason(seller, documents);

  async function reviewDocument(documentId: string, action: "approve" | "reject") {
    setBusyId(documentId);
    try {
      const res = await fetch("/api/admin/sellers/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update document");
      if (data.documents) onUpdated(data.documents);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card variant="elevated" className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Verification documents</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            approval.isApproved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {approval.isApproved
            ? "All required documents approved"
            : `${compliance.uploadedRequiredCount}/${compliance.requiredCount} uploaded`}
        </span>
      </div>

      {approveBlockReason && seller.status !== "approved" ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {approveBlockReason}
        </p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {applicable.map((spec) => {
          const uploads = grouped[spec.id] ?? [];
          const required = isDocumentRequired(spec.id, seller.entityType);
          const latest = uploads[0];

          return (
            <li
              key={spec.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-neutral-100 px-4 py-3 text-sm"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                {latest?.status === "approved" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : latest?.status === "rejected" ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-300" />
                )}
                <div className="min-w-0">
                  <p className="font-medium">
                    {spec.label}
                    {required ? " *" : ""}
                  </p>
                  {latest ? (
                    <>
                      <p className="truncate text-neutral-500">{latest.fileName}</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadge(latest.status)}`}
                      >
                        {latest.status}
                      </span>
                    </>
                  ) : (
                    <p className="text-neutral-400">Not uploaded</p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                {latest ? (
                  <a
                    href={latest.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline"
                  >
                    Open
                  </a>
                ) : null}
                {canManage && latest && latest.status !== "approved" ? (
                  <Button
                    size="sm"
                    disabled={busyId === latest.id}
                    onClick={() => void reviewDocument(latest.id, "approve")}
                  >
                    Approve
                  </Button>
                ) : null}
                {canManage && latest && latest.status !== "rejected" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500"
                    disabled={busyId === latest.id}
                    onClick={() => void reviewDocument(latest.id, "reject")}
                  >
                    Reject
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
