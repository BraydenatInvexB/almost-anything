"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleIcon, FacebookIcon } from "@/components/ui/BrandIcons";
import { useAuth, type OAuthProvider } from "@/context/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/account";
  const reason = searchParams.get("reason");
  const { signIn, signInWithProvider, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

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
    const explicitRedirect = searchParams.get("redirect");
    const destination = redirect.startsWith("/") ? redirect : "/account";

    if (session.staff && !explicitRedirect) {
      router.push("/admin");
      return;
    }

    router.push(destination);
  }

  async function handleOAuth(provider: OAuthProvider) {
    setError("");
    setOauthLoading(provider);
    const result = await signInWithProvider(provider);
    if (result.error) {
      setError(result.error);
      setOauthLoading(null);
    }
  }

  return (
    <Card variant="elevated" className="bg-white p-8">
      <h1 className="text-2xl font-bold text-neutral-900">Sign In</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Access your orders, favorites, and order history.
      </p>

      {reason === "staff-only" && (
        <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
          Staff sign-in required to access the admin console.
        </div>
      )}

      {!isConfigured ? (
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Supabase is not configured. Add your credentials to{" "}
          <code className="text-xs">.env.local</code> to enable auth.
          You can still shop and track orders by order number.
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={!isConfigured || oauthLoading !== null}
          className="flex h-11 items-center justify-center gap-2.5 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {oauthLoading === "google" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
          ) : (
            <GoogleIcon className="h-4 w-4" />
          )}
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("facebook")}
          disabled={!isConfigured || oauthLoading !== null}
          className="flex h-11 items-center justify-center gap-2.5 rounded-full border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {oauthLoading === "facebook" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-700" />
          ) : (
            <FacebookIcon className="h-4 w-4" />
          )}
          Continue with Facebook
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          or sign in with email
        </span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-2xl"
        />
        <Input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="rounded-2xl"
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <Button
          type="submit"
          className="w-full rounded-full"
          isLoading={loading}
          disabled={!isConfigured}
        >
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-neutral-900 hover:underline">
          Sign up
        </Link>
      </p>

      <p className="mt-4 text-center text-sm text-neutral-500">
        Staff member?{" "}
        <Link href="/admin/login" className="font-medium text-neutral-900 hover:underline">
          Admin sign in
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col bg-white">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-neutral-100" />}>
          <LoginForm />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
