"use client";

import { Send } from "lucide-react";
import type { EmailAudience } from "@/lib/admin/operations-types";
import { BtnPrimary } from "@/components/admin/ui";
import { AUDIENCE_LABELS } from "@/components/admin/email-marketing-constants";

export function EmailMarketingComposeTab({
  canManage,
  audience,
  audienceCount,
  subject,
  previewText,
  body,
  sending,
  onAudienceChange,
  onSubjectChange,
  onPreviewTextChange,
  onBodyChange,
  onSend,
  onSaveDraft,
}: {
  canManage: boolean;
  audience: EmailAudience;
  audienceCount: number;
  subject: string;
  previewText: string;
  body: string;
  sending: boolean;
  onAudienceChange: (audience: EmailAudience) => void;
  onSubjectChange: (value: string) => void;
  onPreviewTextChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSend: (e: React.FormEvent) => void;
  onSaveDraft: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSend} className="space-y-4 rounded-lg border border-neutral-200 p-5">
      <div>
        <label className="text-xs font-semibold text-neutral-600">Send to</label>
        <select
          className="input mt-1"
          value={audience}
          onChange={(e) => onAudienceChange(e.target.value as EmailAudience)}
          disabled={!canManage}
        >
          {Object.entries(AUDIENCE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500">Estimated recipients: {audienceCount}</p>
      </div>
      <div>
        <label className="text-xs font-semibold text-neutral-600">Subject</label>
        <input
          className="input mt-1"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Summer deals are live"
          required
          disabled={!canManage}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-neutral-600">Preview text</label>
        <input
          className="input mt-1"
          value={previewText}
          onChange={(e) => onPreviewTextChange(e.target.value)}
          placeholder="Short line shown in inbox previews"
          disabled={!canManage}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-neutral-600">Message</label>
        <textarea
          className="input mt-1 min-h-[160px] resize-y"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="Write what you want customers to receive…"
          required
          disabled={!canManage}
        />
      </div>
      {canManage ? (
        <div className="flex flex-wrap gap-2">
          <BtnPrimary type="submit" disabled={sending}>
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send now"}
          </BtnPrimary>
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex h-9 items-center rounded-lg border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Save draft
          </button>
        </div>
      ) : null}
    </form>
  );
}
