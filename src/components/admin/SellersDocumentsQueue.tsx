"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SellerNeedsAttentionButton } from "@/components/admin/SellerNeedsAttentionButton";
import type { SellerDocumentQueueRow } from "@/types/seller-admin";

const STATUS_CLASS: Record<SellerDocumentQueueRow["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export function SellersDocumentsQueue({
  documents: initialDocuments,
  canManage,
}: {
  documents: SellerDocumentQueueRow[];
  canManage: boolean;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function review(documentId: string, action: "approve" | "reject") {
    setBusyId(documentId);
    try {
      const res = await fetch("/api/admin/sellers/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update document");
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === documentId
            ? { ...doc, status: action === "approve" ? "approved" : "rejected" }
            : doc,
        ),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card variant="elevated" className="overflow-hidden bg-white">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="text-lg font-semibold">Seller verification documents</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Review uploads from every seller in one place. Open a file, approve it, or send a needs-attention message.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Uploaded</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-neutral-50 align-top">
                <td className="px-4 py-3">
                  <Link href={`/admin/sellers/${doc.sellerId}?tab=documents`} className="font-medium hover:text-brand">
                    {doc.sellerShopName}
                  </Link>
                  <p className="text-xs text-neutral-500">{doc.sellerCompanyName}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{doc.docLabel}</p>
                  <p className="truncate text-xs text-neutral-500">{doc.fileName}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_CLASS[doc.status]}`}>
                    {doc.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline">
                      Open
                    </a>
                    {canManage && doc.status === "pending" ? (
                      <>
                        <Button size="sm" disabled={busyId === doc.id} onClick={() => void review(doc.id, "approve")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500" disabled={busyId === doc.id} onClick={() => void review(doc.id, "reject")}>
                          Reject
                        </Button>
                      </>
                    ) : null}
                    {canManage ? (
                      <SellerNeedsAttentionButton sellerId={doc.sellerId} shopName={doc.sellerShopName} />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!documents.length ? (
        <p className="p-6 text-sm text-neutral-500">No documents in this queue.</p>
      ) : null}
    </Card>
  );
}
