import Link from "next/link";
import { AlertTriangle, Clock, FileText, ShieldX } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatMissingDocuments } from "@/lib/seller/document-compliance";
import type { SellerAccessState } from "@/lib/seller/seller-access";
import type { SellerProfile } from "@/types/seller";

export function SellerVerificationView({
  seller,
  access,
}: {
  seller: SellerProfile;
  access: SellerAccessState;
}) {
  if (access.phase === "approved") {
    return (
      <Card variant="elevated" className="p-8 text-center">
        <p className="font-semibold text-neutral-900">Your seller account is approved.</p>
        <Link href="/seller" className="mt-4 inline-block">
          <Button>Open dashboard</Button>
        </Link>
      </Card>
    );
  }

  if (access.phase === "suspended") {
    return (
      <StatusCard
        icon={<ShieldX className="h-8 w-8 text-red-600" />}
        title="Account suspended"
        description="Your seller account has been suspended. Contact support if you believe this is a mistake."
      />
    );
  }

  if (access.phase === "rejected") {
    return (
      <StatusCard
        icon={<ShieldX className="h-8 w-8 text-red-600" />}
        title="Application not approved"
        description="Your seller application was not approved. Update your documents or contact support for next steps."
        actionHref="/seller/settings"
        actionLabel="Review documents"
      />
    );
  }

  if (access.phase === "submit_documents") {
    return (
      <StatusCard
        icon={<FileText className="h-8 w-8 text-brand" />}
        title="Submit your verification documents"
        description={`Upload all required documents before your dashboard unlocks. Still needed: ${formatMissingDocuments(access.compliance.missingRequired)}.`}
        actionHref="/seller/settings?onboarding=1"
        actionLabel="Upload documents"
      />
    );
  }

  return (
    <StatusCard
      icon={<Clock className="h-8 w-8 text-amber-600" />}
      title="Waiting for admin approval"
      description={`Thanks ${seller.shopName} — your documents are in review. You'll get full dashboard access once an admin approves your application.`}
      note={
        access.documentsApproved
          ? "All required documents are approved. Final account approval is pending."
          : "Some documents are still being reviewed by our team."
      }
      actionHref="/seller/settings"
      actionLabel="View document status"
    />
  );
}

function StatusCard({
  icon,
  title,
  description,
  note,
  actionHref,
  actionLabel,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  note?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card variant="elevated" className="mx-auto max-w-2xl p-8">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">{icon}</div>
        <h1 className="mt-5 text-2xl font-bold text-neutral-900">{title}</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-600">{description}</p>
        {note ? (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {note}
          </p>
        ) : null}
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="mt-6">
            <Button>{actionLabel}</Button>
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
