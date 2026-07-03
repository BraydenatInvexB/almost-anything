"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Panel } from "@/components/admin/ui";
import { StaffManager } from "@/components/admin/StaffManager";
import type { StaffProfile } from "@/types/staff-access";

export function StaffDirectorySection({
  staff,
  canManage,
  currentStaffId,
}: {
  staff: StaffProfile[];
  canManage: boolean;
  currentStaffId?: string;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <Panel
      title="Employee directory"
      action={
        canManage ? (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Invite staff
          </button>
        ) : undefined
      }
    >
      <StaffManager
        staff={staff}
        canManage={canManage}
        currentStaffId={currentStaffId}
        inviteOpen={inviteOpen}
        onInviteOpenChange={setInviteOpen}
        suppressInviteButton
      />
    </Panel>
  );
}
