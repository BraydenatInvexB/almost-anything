"use client";

import Link from "next/link";
import { Loader2, Lock, Mail } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SiteLogo } from "@/components/layout/SiteLogo";
import { useAuth } from "@/context/AuthProvider";
import type { ConsoleLoginTheme } from "@/config/console-login-themes";

export interface ConsoleLoginFooterLink {
  prefix?: string;
  label: string;
  href: string;
}

interface ConsoleEmailSignInProps {
  theme: ConsoleLoginTheme;
  title: string;
  subtitle: string;
  submitLabel: string;
  emailPlaceholder?: string;
  notConfiguredHint?: string;
  loading?: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: string;
  footerLinks?: ConsoleLoginFooterLink[];
}

export function ConsoleEmailSignIn({
  theme,
  title,
  subtitle,
  submitLabel,
  emailPlaceholder = "Email",
  notConfiguredHint,
  loading = false,
  onSubmit,
  error,
  footerLinks = [],
}: ConsoleEmailSignInProps) {
  const { isConfigured } = useAuth();
  const HeaderIcon = theme.icon;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await onSubmit(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center text-center">
        {theme.logoVariant ? (
          <SiteLogo
            variant={theme.logoVariant}
            size="default"
            priority
            className="w-full justify-center"
            imageClassName="h-16 w-auto object-center sm:h-20"
          />
        ) : HeaderIcon ? (
          <span
            className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
            style={{
              backgroundColor: theme.accent,
              color: theme.accent === "#FFD23F" ? "#0a0a0a" : "#ffffff",
            }}
          >
            <HeaderIcon className="h-6 w-6" />
          </span>
        ) : null}
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">{subtitle}</p>
      </div>

      {!isConfigured && notConfiguredHint ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {notConfiguredHint}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <Input
          name="email"
          type="email"
          placeholder={emailPlaceholder}
          autoComplete="email"
          required
          leadingIcon={<Mail className="h-4 w-4" />}
        />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          required
          leadingIcon={<Lock className="h-4 w-4" />}
        />

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="mt-1 w-full" isLoading={loading} disabled={!isConfigured}>
          {submitLabel}
        </Button>
      </form>

      {footerLinks.length ? (
        <div className="mt-7 flex flex-col gap-2.5 border-t border-neutral-100 pt-6">
          {footerLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="flex items-center justify-between rounded-xl border border-neutral-200 bg-[#f9f9f9] px-4 py-3 text-sm transition-colors hover:border-neutral-300 hover:bg-white"
            >
              <span className="text-neutral-500">{link.prefix ?? "Go to"}</span>
              <span className="font-semibold text-neutral-900">{link.label}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ConsoleLoginLoading() {
  return (
    <div className="flex min-h-[320px] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
    </div>
  );
}
