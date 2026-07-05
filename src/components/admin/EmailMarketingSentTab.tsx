import type { EmailBroadcast } from "@/lib/admin/operations-types";
import { StatusBadge } from "@/components/admin/ui";
import { AUDIENCE_LABELS } from "@/components/admin/email-marketing-constants";

export function EmailMarketingSentTab({ broadcasts }: { broadcasts: EmailBroadcast[] }) {
  return (
    <div className="space-y-3">
      {broadcasts.length === 0 ? (
        <p className="text-sm text-neutral-500">No emails sent yet.</p>
      ) : (
        broadcasts.map((b) => (
          <div key={b.id} className="rounded-lg border border-neutral-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-neutral-900">{b.subject}</p>
                <p className="mt-1 text-xs text-neutral-500">
                  {AUDIENCE_LABELS[b.audience]} · {b.recipientCount} recipients
                </p>
              </div>
              <StatusBadge status={b.status} />
            </div>
            {b.previewText ? (
              <p className="mt-2 text-sm text-neutral-600">{b.previewText}</p>
            ) : null}
            <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{b.body}</p>
            <p className="mt-3 text-[11px] text-neutral-400">
              {b.sentAt
                ? `Sent ${new Date(b.sentAt).toLocaleString()}`
                : `Created ${new Date(b.createdAt).toLocaleString()}`}
              {b.createdBy ? ` · ${b.createdBy}` : ""}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
