"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ADMIN_LOGIN_DEFAULT_REDIRECT,
  CUSTOMER_LOGIN_PATH,
  SELLER_LOGIN_PATH,
} from "@/config/console-auth";
import { CONSOLE_LOGIN_THEMES } from "@/config/console-login-themes";
import { sanitizeConsoleRedirect } from "@/lib/auth/console-redirect";
import { useConsoleAuthGate } from "@/hooks/useConsoleAuthGate";
import {
  ConsoleEmailSignIn,
  ConsoleLoginLoading,
} from "@/components/auth/ConsoleEmailSignIn";
import { useAuth } from "@/context/AuthProvider";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeConsoleRedirect(
    searchParams.get("redirect"),
    "/admin",
    ADMIN_LOGIN_DEFAULT_REDIRECT,
  );
  const { signIn } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const isInvite =
      params.get("type") === "invite" ||
      hashParams.get("type") === "invite" ||
      params.has("token_hash") ||
      params.has("code");
    if (isInvite) {
      router.replace(`/admin/accept-invite${window.location.search}${window.location.hash}`);
    }
  }, [router]);

  const resolveRedirect = useCallback(
    (data: Record<string, unknown>) =>
      data.staff ? sanitizeConsoleRedirect(redirect, "/admin", ADMIN_LOGIN_DEFAULT_REDIRECT) : null,
    [redirect],
  );

  const { authLoading, checking } = useConsoleAuthGate({
    sessionUrl: "/api/admin/session",
    resolveRedirect,
  });

  async function handleSubmit(email: string, password: string) {
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
        "This account is not authorized for admin access. Use an invited staff email or contact your platform owner.",
      );
      setLoading(false);
      return;
    }

    router.replace(redirect);
    router.refresh();
  }

  const theme = CONSOLE_LOGIN_THEMES.admin;

  if (authLoading || checking) return <ConsoleLoginLoading />;

  return (
    <ConsoleEmailSignIn
      theme={theme}
      title="Staff sign in"
      subtitle="Secure access to the admin console"
      submitLabel="Sign in to admin"
      emailPlaceholder="Staff email"
      notConfiguredHint="Supabase is not configured — admin runs in demo mode without sign-in."
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      footerLinks={[
        { prefix: "Shopping?", label: "Customer sign in", href: CUSTOMER_LOGIN_PATH },
        { prefix: "Selling?", label: "Seller sign in", href: SELLER_LOGIN_PATH },
      ]}
    />
  );
}

export function AdminLoginPanel() {
  return (
    <Suspense fallback={<ConsoleLoginLoading />}>
      <AdminLoginForm />
    </Suspense>
  );
}
