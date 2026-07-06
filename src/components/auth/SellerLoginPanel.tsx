"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CUSTOMER_LOGIN_PATH, SELLER_LOGIN_DEFAULT_REDIRECT } from "@/config/console-auth";
import { CONSOLE_LOGIN_THEMES } from "@/config/console-login-themes";
import { sanitizeConsoleRedirect } from "@/lib/auth/console-redirect";
import { useConsoleAuthGate } from "@/hooks/useConsoleAuthGate";
import {
  ConsoleEmailSignIn,
  ConsoleLoginLoading,
} from "@/components/auth/ConsoleEmailSignIn";
import { useAuth } from "@/context/AuthProvider";

function SellerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeConsoleRedirect(
    searchParams.get("redirect"),
    "/seller",
    SELLER_LOGIN_DEFAULT_REDIRECT,
  );
  const { signIn } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resolveRedirect = useCallback(
    (data: Record<string, unknown>) =>
      data.seller ? sanitizeConsoleRedirect(redirect, "/seller", SELLER_LOGIN_DEFAULT_REDIRECT) : null,
    [redirect],
  );

  const { authLoading, checking } = useConsoleAuthGate({
    sessionUrl: "/api/seller/session",
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

    const sessionRes = await fetch("/api/seller/session");
    if (!sessionRes.ok) {
      setError(
        "Signed in, but this account is not linked to a seller profile. Register your business first.",
      );
      setLoading(false);
      return;
    }

    router.replace(redirect);
    router.refresh();
  }

  const theme = CONSOLE_LOGIN_THEMES.seller;

  if (authLoading || checking) return <ConsoleLoginLoading />;

  return (
    <ConsoleEmailSignIn
      theme={theme}
      title="Seller sign in"
      subtitle="Manage your catalog, orders, and payouts"
      submitLabel="Sign in to dashboard"
      emailPlaceholder="Seller email"
      notConfiguredHint="Supabase is not configured — seller sign-in is unavailable."
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      footerLinks={[
        { prefix: "New seller?", label: "Register your business", href: "/sell/register" },
        { prefix: "Shopping instead?", label: "Customer sign in", href: CUSTOMER_LOGIN_PATH },
      ]}
    />
  );
}

export function SellerLoginPanel() {
  return (
    <Suspense fallback={<ConsoleLoginLoading />}>
      <SellerLoginForm />
    </Suspense>
  );
}
