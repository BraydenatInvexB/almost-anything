"use client";

import { ChartColumn, Loader2 } from "lucide-react";
import {
  memberHasGrant,
  roleIncludesGrant,
  type SellerTeamGrant,
} from "@/config/seller-team-grants";
import { cn } from "@/lib/utils/cn";
import type { SellerTeamMember } from "@/types/seller";

export function SellerTeamGrantToggle({
  member,
  grant,
  busy,
  onToggle,
}: {
  member: SellerTeamMember;
  grant: SellerTeamGrant;
  busy?: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  const includedInRole = roleIncludesGrant(member.role, grant);
  const enabled = memberHasGrant(member, grant);

  return (
    <button
      type="button"
      disabled={busy || includedInRole}
      onClick={() => onToggle(!enabled)}
      title={
        includedInRole
          ? `${grant.label} is included with the ${member.role} role`
          : enabled
            ? `Hide ${grant.label.toLowerCase()} from this teammate`
            : grant.description
      }
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
        enabled
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-100"
          : "bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-100",
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChartColumn className="h-3.5 w-3.5" />}
      {includedInRole ? "Revenue on" : enabled ? "Hide revenue" : grant.shortLabel}
    </button>
  );
}
