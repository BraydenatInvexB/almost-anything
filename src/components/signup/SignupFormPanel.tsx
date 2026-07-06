"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Phone } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleIcon, FacebookIcon } from "@/components/ui/BrandIcons";
import { SocialAuthButton } from "@/components/auth/SocialAuthButton";
import { useAuth, type OAuthProvider } from "@/context/AuthProvider";
import { AVATARS, DEFAULT_AVATAR } from "@/config/avatars";
import { cn } from "@/lib/utils/cn";

export function SignupFormPanel() {
  const router = useRouter();
  const { signUp, signInWithProvider, isConfigured } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

  async function handleOAuth(provider: OAuthProvider) {
    setError("");
    setOauthLoading(provider);
    const result = await signInWithProvider(provider);
    if (result.error) {
      setError(result.error);
      setOauthLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signUp({
      email,
      password,
      firstName,
      lastName,
      phone,
      avatarUrl: avatar,
    });
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/complete-profile");
  }

  return (
    <div className="p-7 sm:p-10">
      <h1 className="text-2xl font-bold text-neutral-900">Create your account</h1>
      <p className="mt-1.5 text-sm text-neutral-500">
        It only takes a minute. Already have one?{" "}
        <Link href="/login" className="font-semibold text-neutral-900 hover:underline">
          Sign in
        </Link>
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <SocialAuthButton
          label="Continue with Google"
          onClick={() => handleOAuth("google")}
          disabled={!isConfigured || oauthLoading !== null}
          loading={oauthLoading === "google"}
          icon={<GoogleIcon className="h-5 w-5" />}
        />
        <SocialAuthButton
          label="Continue with Facebook"
          onClick={() => handleOAuth("facebook")}
          disabled={!isConfigured || oauthLoading !== null}
          loading={oauthLoading === "facebook"}
          icon={<FacebookIcon className="h-5 w-5" />}
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          or sign up with email
        </span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-neutral-900 ring-offset-2">
              <Image
                src={avatar}
                alt="Selected avatar"
                fill
                sizes="56px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900">Choose your avatar</p>
              <p className="text-xs text-neutral-400">Tap one to personalize your profile.</p>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2.5">
            {AVATARS.map((src) => {
              const selected = src === avatar;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setAvatar(src)}
                  aria-label="Select avatar"
                  aria-pressed={selected}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-full transition-all",
                    selected
                      ? "ring-2 ring-neutral-900 ring-offset-2"
                      : "ring-1 ring-neutral-200 hover:ring-neutral-400 hover:brightness-105",
                  )}
                >
                  <Image
                    src={src}
                    alt="Avatar option"
                    fill
                    sizes="(max-width: 640px) 18vw, 90px"
                    className="object-cover"
                  />
                  {selected && (
                    <span className="absolute inset-0 flex items-center justify-center bg-neutral-900/25">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
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
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-2xl"
          />
          <Input
            type="tel"
            inputMode="tel"
            placeholder="Phone number"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leadingIcon={<Phone className="h-4 w-4" />}
            className="rounded-2xl"
          />
          <Input
            type="password"
            placeholder="Password (min 6 characters)"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-2xl"
          />
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}

        <Button
          type="submit"
          className="w-full rounded-full"
          isLoading={loading}
          disabled={!isConfigured}
        >
          Create Account
        </Button>

        {!isConfigured && (
          <p className="text-center text-xs text-neutral-400">
            Connect Supabase in <code className="font-mono">.env.local</code> to enable sign up.
          </p>
        )}

        <p className="text-center text-xs leading-relaxed text-neutral-400">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}
