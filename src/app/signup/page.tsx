"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, Truck, Tag, Phone } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GoogleIcon, FacebookIcon } from "@/components/ui/BrandIcons";
import { useAuth, type OAuthProvider } from "@/context/AuthProvider";
import { AVATARS, DEFAULT_AVATAR } from "@/config/avatars";
import { cn } from "@/lib/utils/cn";

const PERKS = [
  { icon: Truck, label: "Fast, tracked delivery on every order" },
  { icon: Tag, label: "Member only deals across all categories" },
  { icon: ShieldCheck, label: "Secure checkout & easy 30 day returns" },
];

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithProvider, isConfigured } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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

    setSuccess(true);
    setLoading(false);
    if (result.needsEmailConfirmation) return;
    router.push("/complete-profile");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="grid w-full min-w-0 max-w-5xl overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-[0_24px_70px_-30px_rgba(0,0,0,0.35)] lg:grid-cols-[1.05fr_1fr]">
          {/* ── Brand panel ── */}
          <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-neutral-200 bg-linear-to-br from-neutral-50 to-[#eef3df] p-10 lg:flex">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
              style={{ background: "radial-gradient(circle, var(--brand) 0%, transparent 70%)", opacity: 0.18 }}
            />
            <div
              className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full"
              style={{ background: "radial-gradient(circle, #cbd5e1 0%, transparent 70%)", opacity: 0.4 }}
            />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Almost Anything
              </span>
              <h2 className="mt-8 text-3xl font-extrabold leading-tight text-neutral-900">
                The store that has
                <br />
                almost everything.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-500">
                Create your free account to shop thousands of products, save favorites,
                and track every order in one place.
              </p>

              <ul className="mt-8 flex flex-col gap-3">
                {PERKS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm text-neutral-700">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/15">
                      <Icon className="h-4 w-4 text-brand" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex -space-x-3">
                {AVATARS.slice(0, 4).map((src) => (
                  <Image
                    key={src}
                    src={src}
                    alt="Member"
                    width={40}
                    height={40}
                    sizes="40px"
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                  />
                ))}
              </div>
              <p className="text-xs text-neutral-500">
                Join <span className="font-semibold text-neutral-900">50,000+</span> happy shoppers
              </p>
            </div>
          </aside>

          {/* ── Form panel ── */}
          <div className="p-7 sm:p-10">
            <h1 className="text-2xl font-bold text-neutral-900">Create your account</h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              It only takes a minute. Already have one?{" "}
              <Link href="/login" className="font-semibold text-neutral-900 hover:underline">
                Sign in
              </Link>
            </p>

            {success ? (
              <div className="mt-8 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-800">
                <p className="font-semibold">Account created!</p>
                <p className="mt-1">
                  Check your email to confirm your address, then sign in to finish setting up
                  your account.
                </p>
              </div>
            ) : (
              <>
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
                    or sign up with email
                  </span>
                  <span className="h-px flex-1 bg-neutral-200" />
                </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                {/* Avatar picker */}
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
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
