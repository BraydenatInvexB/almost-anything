"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/supabase/auth-errors";
import type { User } from "@supabase/supabase-js";

export type OAuthProvider = "google" | "facebook";

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: SignUpData) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signInWithProvider: (provider: OAuthProvider) => Promise<{ error?: string }>;
  updateProfile: (data: Record<string, unknown>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project"),
  );

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isConfigured);

  useEffect(() => {
    if (!isConfigured) return;

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [isConfigured]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isConfigured) {
        return { error: "Auth requires Supabase configuration. See .env.local" };
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: formatAuthError(error) };
    },
    [isConfigured],
  );

  const signUp = useCallback(
    async ({ email, password, firstName, lastName, phone, avatarUrl }: SignUpData) => {
      if (!isConfigured) {
        return { error: "Auth requires Supabase configuration. See .env.local" };
      }
      const supabase = createClient();
      const fullName = `${firstName} ${lastName}`.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
            avatar_url: avatarUrl,
          },
        },
      });
      return {
        error: formatAuthError(error),
        needsEmailConfirmation: !error && !data.session,
      };
    },
    [isConfigured],
  );

  const signInWithProvider = useCallback(
    async (provider: OAuthProvider) => {
      if (!isConfigured) {
        return { error: "Auth requires Supabase configuration. See .env.local" };
      }
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback?next=/complete-profile`
              : undefined,
        },
      });
      return { error: formatAuthError(error) };
    },
    [isConfigured],
  );

  const updateProfile = useCallback(
    async (data: Record<string, unknown>) => {
      if (!isConfigured) {
        return { error: "Auth requires Supabase configuration. See .env.local" };
      }
      const supabase = createClient();
      const { data: updated, error } = await supabase.auth.updateUser({ data });
      if (updated.user) setUser(updated.user);
      return { error: formatAuthError(error) };
    },
    [isConfigured],
  );

  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, [isConfigured]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signInWithProvider,
      updateProfile,
      signOut,
      isConfigured,
    }),
    [user, loading, signIn, signUp, signInWithProvider, updateProfile, signOut, isConfigured],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
