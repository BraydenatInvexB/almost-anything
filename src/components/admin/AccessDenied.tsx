import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ROLE_META } from "@/config/rbac";
import type { StaffRole } from "@/types/database";

export function AccessDenied({
  feature,
  role,
}: {
  feature?: string;
  role?: StaffRole | null;
}) {
  const roleLabel = role ? ROLE_META[role]?.label : null;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-bold text-neutral-900">Access restricted</h1>
      <p className="max-w-sm text-sm text-neutral-500">
        {roleLabel ? (
          <>
            Your <span className="font-medium">{roleLabel}</span> role doesn&apos;t include access to{" "}
            {feature ? <span className="font-medium">{feature}</span> : "this section"}.
          </>
        ) : (
          <>
            Your role doesn&apos;t have permission to view{" "}
            {feature ? <span className="font-medium">{feature}</span> : "this section"}.
          </>
        )}{" "}
        Contact a platform administrator if you believe this is a mistake.
      </p>
      <Link
        href="/admin"
        className="mt-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
