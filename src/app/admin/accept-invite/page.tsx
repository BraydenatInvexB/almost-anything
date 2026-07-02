"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthProvider";
import { createClient } from "@/lib/supabase/client";

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, updatePassword, isConfigured } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [establishingSession, setEstablishingSession] = useState(true);

  useEffect(() => {
    if (!isConfigured) {
      setEstablishingSession(false);
      return;
    }

    let cancelled = false;

    async function establishSession() {
      const supabase = createClient();
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (tokenHash && type === "invite") {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "invite",
          });
          if (verifyError) throw verifyError;
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "This invitation link is invalid or has expired. Ask your admin to resend it.",
          );
        }
      } finally {
        if (!cancelled) setEstablishingSession(false);
      }
    }

    void establishSession();
    return () => {
      cancelled = true;
    };
  }, [isConfigured, searchParams]);

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

    const sessionRes = await fetch("/api/admin/session");
    const session = await sessionRes.json();

    if (!session.staff) {
      setError("This account is not authorized for admin access. Contact your administrator.");
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  if (authLoading || establishingSession) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="text-sm text-neutral-500">Verifying your invitation…</p>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Supabase is not configured — admin runs in demo mode without sign-in.
      </div>
    );
  }

  if (!user && error) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/admin/login"
          className="text-sm font-semibold text-neutral-900 underline underline-offset-2"
        >
          Back to staff sign in
        </Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-neutral-600">
          Open the invitation link from your email to activate your staff account.
        </p>
        <Link
          href="/admin/login"
          className="text-sm font-semibold text-neutral-900 underline underline-offset-2"
        >
          Already set a password? Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-[3px] border-black bg-white p-8 shadow-[6px_6px_0_0_#000]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-black bg-brand text-white">
          <Shield className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-neutral-900">
            Set your password
          </h1>
          <p className="text-sm text-neutral-500">
            {user.email ? `Welcome, ${user.email}` : "Create a password for admin access"}
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
          Activate admin account
        </Button>
      </form>
    </div>
  );
}

export default function AdminAcceptInvitePage() {
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
