"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";

interface ConsoleAuthGateOptions {
  sessionUrl: string;
  resolveRedirect: (payload: Record<string, unknown>) => string | null;
}

/** If the user is already signed in with console access, send them to the dashboard. */
export function useConsoleAuthGate({
  sessionUrl,
  resolveRedirect,
}: ConsoleAuthGateOptions) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    setChecking(true);
    fetch(sessionUrl)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        const destination = resolveRedirect(data as Record<string, unknown>);
        if (destination) {
          router.replace(destination);
          router.refresh();
        }
      })
      .finally(() => setChecking(false));
  }, [authLoading, user, router, sessionUrl, resolveRedirect]);

  return { authLoading, checking };
}
