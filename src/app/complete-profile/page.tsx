"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Phone, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthProvider";
import type { User } from "@supabase/supabase-js";

function ProfileForm({
  user,
  first,
  last,
  existingPhone,
  isConfigured,
  updateProfile,
  onDone,
}: {
  user: User;
  first: string;
  last: string;
  existingPhone: string;
  isConfigured: boolean;
  updateProfile: (data: Record<string, unknown>) => Promise<{ error?: string }>;
  onDone: () => void;
}) {
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [phone, setPhone] = useState(existingPhone);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const meta = user.user_metadata ?? {};
  const avatarUrl = (meta.avatar_url as string) || (meta.picture as string) || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const fullName = `${firstName} ${lastName}`.trim();
    const result = await updateProfile({
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      phone: phone || null,
    });

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    onDone();
  }

  return (
    <Card variant="elevated" className="bg-white p-8">
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Your avatar"
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-lg font-bold text-white">
            {(firstName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            Welcome{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="text-sm text-neutral-500">Just one quick step to finish up.</p>
        </div>
      </div>

      <div className="mt-6 flex items-start gap-2.5 rounded-2xl bg-neutral-50 p-3.5 text-xs text-neutral-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-700" />
        <p>
          Add your mobile number so we can send order updates and delivery
          notifications. We&apos;ll never share it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="First name"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="rounded-2xl"
          />
          <Input
            placeholder="Surname"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="rounded-2xl"
          />
        </div>

        <Input
          type="tel"
          inputMode="tel"
          placeholder="Phone number"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          leadingIcon={<Phone className="h-4 w-4" />}
          className="rounded-2xl"
        />

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <Button
          type="submit"
          className="w-full rounded-full"
          isLoading={saving}
          disabled={!isConfigured}
        >
          Save & Continue
        </Button>
      </form>

      <button
        type="button"
        onClick={onDone}
        className="mt-4 w-full text-center text-sm font-medium text-neutral-400 hover:text-neutral-600"
      >
        Skip for now
      </button>
    </Card>
  );
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, loading, isConfigured, updateProfile } = useAuth();

  const meta = user?.user_metadata ?? {};
  const existingPhone = (meta.phone as string | undefined) ?? "";

  const [first, last] = useMemo(() => {
    const full = (meta.full_name as string) || (meta.name as string) || "";
    const parts = full.trim().split(/\s+/);
    return [parts[0] ?? "", parts.slice(1).join(" ")];
  }, [meta.full_name, meta.name]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (existingPhone) {
      router.replace("/account");
    }
  }, [loading, user, existingPhone, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh flex-col bg-white">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <ProfileForm
          key={user.id}
          user={user}
          first={first}
          last={last}
          existingPhone={existingPhone}
          isConfigured={isConfigured}
          updateProfile={updateProfile}
          onDone={() => router.push("/account")}
        />
      </main>
    </div>
  );
}
