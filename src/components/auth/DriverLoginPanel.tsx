"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CUSTOMER_LOGIN_PATH,
  DRIVER_LOGIN_DEFAULT_REDIRECT,
} from "@/config/console-auth";
import { CONSOLE_LOGIN_THEMES } from "@/config/console-login-themes";
import { sanitizeConsoleRedirect } from "@/lib/auth/console-redirect";
import { useConsoleAuthGate } from "@/hooks/useConsoleAuthGate";
import {
  ConsoleEmailSignIn,
  ConsoleLoginLoading,
} from "@/components/auth/ConsoleEmailSignIn";
import { useAuth } from "@/context/AuthProvider";

function DriverLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = sanitizeConsoleRedirect(
    searchParams.get("redirect"),
    "/driver",
    DRIVER_LOGIN_DEFAULT_REDIRECT,
  );
  const { signIn } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resolveRedirect = useCallback(
    (data: Record<string, unknown>) =>
      data.driver ? sanitizeConsoleRedirect(redirect, "/driver", DRIVER_LOGIN_DEFAULT_REDIRECT) : null,
    [redirect],
  );

  const { authLoading, checking } = useConsoleAuthGate({
    sessionUrl: "/api/driver/session",
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

    const sessionRes = await fetch("/api/driver/session");
    if (!sessionRes.ok) {
      setError("Signed in, but this account is not registered as a driver. Apply first.");
      setLoading(false);
      return;
    }

    router.replace(redirect);
    router.refresh();
  }

  if (authLoading || checking) return <ConsoleLoginLoading />;

  return (
    <ConsoleEmailSignIn
      theme={CONSOLE_LOGIN_THEMES.driver}
      title="Driver sign in"
      subtitle="Collect and deliver multi-store orders in your province"
      submitLabel="Sign in"
      emailPlaceholder="Driver email"
      notConfiguredHint="Supabase is not configured — driver sign-in is unavailable."
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
      footerLinks={[
        { prefix: "New driver?", label: "Sign up to deliver", href: "/driver/register" },
        { prefix: "Shopping instead?", label: "Customer sign in", href: CUSTOMER_LOGIN_PATH },
        { prefix: "", label: "Back to home", href: "/" },
      ]}
    />
  );
}

export function DriverLoginPanel() {
  return (
    <Suspense fallback={<ConsoleLoginLoading />}>
      <DriverLoginForm />
    </Suspense>
  );
}
