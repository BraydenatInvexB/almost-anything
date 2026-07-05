"use client";

import { Plus, Trash2, Users } from "lucide-react";
import type { DemoCustomer } from "@/lib/admin/demo-data";
import type { EmailSubscriber } from "@/lib/admin/operations-types";
import { BtnPrimary, StatusBadge, Td, Th } from "@/components/admin/ui";

export function EmailMarketingListTab({
  subscribers,
  customers,
  canManage,
  newEmail,
  newName,
  onNewEmailChange,
  onNewNameChange,
  onAddSubscriber,
  onRemoveSubscriber,
}: {
  subscribers: EmailSubscriber[];
  customers: DemoCustomer[];
  canManage: boolean;
  newEmail: string;
  newName: string;
  onNewEmailChange: (value: string) => void;
  onNewNameChange: (value: string) => void;
  onAddSubscriber: (e: React.FormEvent) => void;
  onRemoveSubscriber: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {canManage ? (
        <form onSubmit={onAddSubscriber} className="flex flex-wrap gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <input
            className="input min-w-[200px] flex-1"
            type="email"
            placeholder="Email address"
            value={newEmail}
            onChange={(e) => onNewEmailChange(e.target.value)}
            required
          />
          <input
            className="input min-w-[160px] flex-1"
            placeholder="Name (optional)"
            value={newName}
            onChange={(e) => onNewNameChange(e.target.value)}
          />
          <BtnPrimary type="submit">
            <Plus className="h-4 w-4" /> Add to list
          </BtnPrimary>
        </form>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50 text-left">
              <Th>Email</Th>
              <Th>Name</Th>
              <Th>Source</Th>
              <Th>Status</Th>
              {canManage ? <Th /> : null}
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.id} className="border-b border-neutral-50">
                <Td className="font-medium">{s.email}</Td>
                <Td>{s.name ?? "—"}</Td>
                <Td className="capitalize">{s.source}</Td>
                <Td>
                  <StatusBadge status={s.status} />
                </Td>
                {canManage ? (
                  <Td>
                    <button
                      type="button"
                      onClick={() => onRemoveSubscriber(s.id)}
                      className="text-neutral-400 hover:text-red-600"
                      aria-label="Remove subscriber"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500">
        <Users className="mr-1 inline h-3.5 w-3.5" />
        {subscribers.filter((s) => s.status === "active").length} active subscribers ·{" "}
        {customers.length} customers in CRM (included when sending to customers or everyone)
      </p>
    </div>
  );
}
