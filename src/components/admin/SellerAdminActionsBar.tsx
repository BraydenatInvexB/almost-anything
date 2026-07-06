"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { SellerProfile } from "@/types/seller";

export function SellerAdminActionsBar({
  seller,
  canManage,
  onStatusChange,
}: {
  seller: SellerProfile;
  canManage: boolean;
  onStatusChange: (status: SellerProfile["status"]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetError, setResetError] = useState("");

  async function updateStatus(action: "approve" | "suspend" | "reject") {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: seller.id, action }),
      });
      if (res.ok) {
        const map = { approve: "approved", suspend: "suspended", reject: "rejected" } as const;
        onStatusChange(map[action]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setResetMsg("");
    setResetError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sellers/${seller.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: seller.contactEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reset failed");
      setResetMsg(`Password reset email sent to ${seller.contactEmail}.`);
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  if (!canManage) {
    return <p className="text-sm text-neutral-500">You have view-only access to seller records.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => void updateStatus("approve")}>Approve</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => void updateStatus("suspend")}>Suspend</Button>
        <Button size="sm" variant="ghost" className="text-red-500" disabled={busy} onClick={() => void updateStatus("reject")}>Reject</Button>
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => void resetPassword()}>Reset password</Button>
      </div>
      {resetMsg ? <p className="text-sm text-emerald-700">{resetMsg}</p> : null}
      {resetError ? <p className="text-sm text-red-500">{resetError}</p> : null}
    </div>
  );
}
