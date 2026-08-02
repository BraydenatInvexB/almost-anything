"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SA_PROVINCES } from "@/config/provinces";
import { DRIVER_LOGIN_PATH } from "@/config/console-auth";
import { CONSOLE_LOGIN_THEMES } from "@/config/console-login-themes";
import { useAuth } from "@/context/AuthProvider";

export function DriverRegisterForm() {
  const router = useRouter();
  const { signUp, isConfigured } = useAuth();
  const theme = CONSOLE_LOGIN_THEMES.driver;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [province, setProvince] = useState<(typeof SA_PROVINCES)[number]>("Gauteng");
  const [vehicleNotes, setVehicleNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConfigured) {
      setError("Auth is not configured.");
      return;
    }

    setLoading(true);
    setError("");

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] ?? "Driver";
    const lastName = nameParts.slice(1).join(" ") || "Partner";

    const authResult = await signUp({
      email: email.trim(),
      password,
      firstName,
      lastName,
      phone: phone.trim() || undefined,
    });
    if (authResult.error) {
      setError(authResult.error);
      setLoading(false);
      return;
    }

    const reg = await fetch("/api/driver/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        province,
        vehicleNotes: vehicleNotes.trim() || undefined,
      }),
    });
    const body = (await reg.json().catch(() => ({}))) as { error?: string };
    if (!reg.ok) {
      setError(body.error ?? "Could not complete registration.");
      setLoading(false);
      return;
    }

    const sessionRes = await fetch("/api/driver/session");
    if (sessionRes.ok) {
      router.replace("/driver");
    } else {
      router.replace(`${DRIVER_LOGIN_PATH}?registered=1`);
    }
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl text-white"
        style={{ backgroundColor: theme.accent }}
      >
        {theme.icon ? <theme.icon className="h-6 w-6" /> : null}
      </div>
      <h1 className="text-2xl font-bold text-neutral-900">Drive with Almost Anything</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Sign up to collect multi-store orders in your province and deliver them to customers.
        An admin will approve you before you can claim jobs.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-neutral-700">Full name</span>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-neutral-700">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-neutral-700">Phone</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-neutral-700">Password</span>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-neutral-700">Province you cover</span>
          <select
            required
            value={province}
            onChange={(e) => setProvince(e.target.value as (typeof SA_PROVINCES)[number])}
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          >
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-neutral-700">Vehicle (optional)</span>
          <input
            value={vehicleNotes}
            onChange={(e) => setVehicleNotes(e.target.value)}
            placeholder="e.g. Bakkie, sedan"
            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: theme.accent }}
        >
          {loading ? "Submitting…" : "Create driver account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already registered?{" "}
        <Link href={DRIVER_LOGIN_PATH} className="font-semibold text-neutral-900 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
