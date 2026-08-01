"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Mail, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  SELLER_ASSIGNABLE_ROLES,
  SELLER_TEAM_ROLE_META,
  type SellerAssignableRole,
} from "@/config/seller-team-roles";
import { cn } from "@/lib/utils/cn";
import type { SellerTeamMember } from "@/types/seller";

type Feedback = { tone: "ok" | "error"; text: string } | null;

export function SellerTeamDesk() {
  const [team, setTeam] = useState<SellerTeamMember[]>([]);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<SellerAssignableRole>("staff");
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadTeam = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/seller/team");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load team");
      setTeam(data.team ?? []);
    } catch {
      setTeam([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  async function invite() {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/seller/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invite failed");

      setTeam((list) => {
        const without = list.filter((m) => m.id !== data.member.id && m.email !== data.member.email);
        return [...without, data.member];
      });
      setEmail("");
      setFullName("");
      setRole("staff");
      setFeedback({
        tone: "ok",
        text: `Password setup email sent to ${data.member.email}. They open the link, choose a password, and join your shop.`,
      });
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "Invite failed",
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateMember(
    member: SellerTeamMember,
    updates: { role?: SellerAssignableRole; status?: SellerTeamMember["status"] },
  ) {
    setBusyId(member.id);
    setFeedback(null);
    try {
      const res = await fetch("/api/seller/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id, ...updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setTeam((list) => list.map((m) => (m.id === member.id ? data.member : m)));
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "Update failed",
      });
      await loadTeam();
    } finally {
      setBusyId(null);
    }
  }

  async function resendInvite(member: SellerTeamMember) {
    setBusyId(member.id);
    setFeedback(null);
    try {
      const res = await fetch("/api/seller/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: member.email,
          fullName: member.fullName,
          role: member.role === "owner" ? "staff" : member.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not resend invitation");
      if (data.member) {
        setTeam((list) => list.map((m) => (m.id === member.id ? data.member : m)));
      }
      setFeedback({
        tone: "ok",
        text: `Password setup email resent to ${member.email}.`,
      });
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "Could not resend invitation",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function removeMember(member: SellerTeamMember) {
    const confirmed = window.confirm(
      `Remove ${member.fullName || member.email} from your team?${
        member.status === "invited" ? " Their pending invitation will be cancelled." : " They will lose seller hub access."
      }`,
    );
    if (!confirmed) return;

    setBusyId(member.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/seller/team?id=${encodeURIComponent(member.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not remove member");
      setTeam((list) => list.filter((m) => m.id !== member.id));
      setFeedback({ tone: "ok", text: `${member.fullName || member.email} removed from the team.` });
    } catch (err) {
      setFeedback({
        tone: "error",
        text: err instanceof Error ? err.message : "Could not remove member",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card variant="elevated" className="p-6">
        <h2 className="text-lg font-semibold">Invite employee</h2>
        <p className="mt-1 text-sm text-neutral-500">
          They get an email with a secure link to set their own password, then join your seller hub.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as SellerAssignableRole)}
            className="rounded-xl border border-neutral-200 px-3 py-2 text-sm sm:col-span-2"
          >
            {SELLER_ASSIGNABLE_ROLES.map((value) => (
              <option key={value} value={value}>
                {SELLER_TEAM_ROLE_META[value].label} — {SELLER_TEAM_ROLE_META[value].description}
              </option>
            ))}
          </select>
          <Button
            type="button"
            className="sm:col-span-2"
            isLoading={loading}
            disabled={!fullName.trim() || !email.trim()}
            onClick={() => void invite()}
          >
            Send invite
          </Button>
        </div>
      </Card>

      {feedback ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
            feedback.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {feedback.tone === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{feedback.text}</p>
        </div>
      ) : null}

      <Card variant="elevated" className="p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Team members</h2>
          {loadingList ? <Loader2 className="h-4 w-4 animate-spin text-neutral-400" /> : null}
        </div>

        {team.length === 0 && !loadingList ? (
          <p className="mt-4 text-sm text-neutral-500">No team members yet. Invite your first employee above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-neutral-100">
            {team.map((member) => {
              const isOwner = member.role === "owner";
              const busy = busyId === member.id;
              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">{member.fullName}</p>
                    <p className="truncate text-sm text-neutral-500">{member.email}</p>
                    <p className="mt-1 text-xs capitalize text-neutral-500">
                      {SELLER_TEAM_ROLE_META[member.role]?.label ?? member.role}
                      {" · "}
                      {member.status}
                    </p>
                  </div>

                  {isOwner ? (
                    <span className="text-sm font-medium text-neutral-600">Owner · Active</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={member.role}
                        disabled={busy}
                        onChange={(e) =>
                          void updateMember(member, {
                            role: e.target.value as SellerAssignableRole,
                          })
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                      >
                        {SELLER_ASSIGNABLE_ROLES.map((value) => (
                          <option key={value} value={value}>
                            {SELLER_TEAM_ROLE_META[value].label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={member.status === "invited" ? "invited" : member.status}
                        disabled={busy || member.status === "invited"}
                        onChange={(e) =>
                          void updateMember(member, {
                            status: e.target.value as "active" | "suspended",
                          })
                        }
                        className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-medium disabled:opacity-50"
                        title={
                          member.status === "invited"
                            ? "Status updates after they accept the invite"
                            : undefined
                        }
                      >
                        {member.status === "invited" ? (
                          <option value="invited">Invited</option>
                        ) : null}
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>

                      {member.status === "invited" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void resendInvite(member)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5 disabled:opacity-50"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Resend
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void removeMember(member)}
                        className="inline-flex items-center justify-center rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Remove ${member.fullName}`}
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
