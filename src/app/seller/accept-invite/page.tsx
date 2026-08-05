"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Users } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthProvider";
import { establishInviteSession } from "@/lib/auth/establish-invite-session";
import { createClient } from "@/lib/supabase/client";

const EXPIRED_MESSAGE =
  "This invitation link is invalid or has expired. Ask your shop owner to resend it.";

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const { user, loading: authLoading, updatePassword, isConfigured } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [establishingSession, setEstablishingSession] = useState(true);
  const [invitedUser, setInvitedUser] = useState<User | null>(null);
  const sessionChecked = useRef(false);

  const callbackError = searchParams.get("error");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const inviteType = searchParams.get("type");

  useEffect(() => {
    if (!isConfigured) {
      setEstablishingSession(false);
      return;
    }
    if (sessionChecked.current) return;
    sessionChecked.current = true;

    let cancelled = false;

    async function establishSession() {
      try {
        const supabase = createClient();
        const result = await establishInviteSession(supabase, {
          code,
          tokenHash,
          type: inviteType,
          callbackError,
          cleanPath: "/seller/accept-invite",
          expiredMessage: EXPIRED_MESSAGE,
        });

        if ("error" in result) {
          if (!cancelled) setError(result.error);
          return;
        }

        if (!cancelled && result.user) setInvitedUser(result.user);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : EXPIRED_MESSAGE);
        }
      } finally {
        if (!cancelled) setEstablishingSession(false);
      }
    }

    void establishSession();
    return () => {
      cancelled = true;
    };
  }, [isConfigured, callbackError, code, tokenHash, inviteType]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const sessionRes = await fetch("/api/seller/session");
    const session = await sessionRes.json().catch(() => ({}));

    if (!sessionRes.ok || !session.seller) {
      setError("This account is not linked to a seller team. Contact your shop owner.");
      setLoading(false);
      return;
    }

    window.location.href = "/seller";
  }

  const activeUser = user ?? invitedUser;
  const verifying = (authLoading && !activeUser) || establishingSession;

  if (verifying) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500">Verifying your invitation…</p>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Supabase is not configured — seller invites are unavailable.
      </div>
    );
  }

  if (!activeUser && error) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/seller/login"
          className="text-sm font-semibold text-neutral-900 underline underline-offset-2"
        >
          Back to seller sign in
        </Link>
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-neutral-600">
          Open the invitation link from your email to set your password and join this seller team.
        </p>
        <Link
          href="/seller/login"
          className="text-sm font-semibold text-neutral-900 underline underline-offset-2"
        >
          Already set a password? Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-200 bg-brand text-white">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
            Set your password
          </h1>
          <p className="text-sm text-neutral-500">
            {activeUser.email
              ? `Choose a password for ${activeUser.email} to access the seller hub`
              : "Choose a password to access the seller hub"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="rounded-xl"
        />
        <Input
          type="password"
          placeholder="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          className="rounded-xl"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full rounded-xl" isLoading={loading}>
          Save password & join team
        </Button>
      </form>
    </div>
  );
}

export default function SellerAcceptInvitePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <SiteLogo variant="compact" />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-neutral-200" />}>
          <AcceptInviteForm />
        </Suspense>
      </main>
    </div>
  );
}
