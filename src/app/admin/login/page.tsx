"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthProvider";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";
  const { signIn, user, loading: authLoading, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingStaff, setCheckingStaff] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;
    setCheckingStaff(true);
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.staff) {
          router.replace(redirect.startsWith("/admin") ? redirect : "/admin");
        }
      })
      .finally(() => setCheckingStaff(false));
  }, [authLoading, user, router, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    const sessionRes = await fetch("/api/admin/session");
    const session = await sessionRes.json();

    if (!session.staff) {
      setError(
        "Signed in, but this account is not authorized for admin. Use an invited staff email, or sign up first if you are the platform owner (first user becomes super admin).",
      );
      setLoading(false);
      return;
    }

    router.push(redirect.startsWith("/admin") ? redirect : "/admin");
  }

  if (authLoading || checkingStaff) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
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
            Staff sign in
          </h1>
          <p className="text-sm text-neutral-500">Admin console access only</p>
        </div>
      </div>

      {!isConfigured ? (
        <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Supabase is not configured — admin runs in demo mode without sign-in.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input
          type="email"
          placeholder="Staff email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-xl"
        />
        <Input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="rounded-xl"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button
          type="submit"
          className="w-full rounded-xl"
          isLoading={loading}
          disabled={!isConfigured}
        >
          Sign in to admin
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-neutral-500">
        Customer account?{" "}
        <Link href="/login" className="font-semibold text-neutral-900 underline underline-offset-2">
          Store sign in
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <SiteLogo variant="compact" />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-neutral-200" />}>
          <AdminLoginForm />
        </Suspense>
      </main>
    </div>
  );
}
