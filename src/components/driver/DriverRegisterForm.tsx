"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SA_PROVINCES } from "@/config/provinces";
import { DRIVER_LOGIN_PATH } from "@/config/console-auth";
import { useAuth } from "@/context/AuthProvider";

const inputClass = "w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-500";

export function DriverRegisterForm({ showIntro = true }: { showIntro?: boolean }) {
  const router = useRouter();
  const { signUp, isConfigured } = useAuth();
  const [values, setValues] = useState({ fullName: "", email: "", phone: "", password: "", province: "Gauteng", vehicleNotes: "", licenceNumber: "", licenceExpiry: "", bankName: "", accountHolder: "", accountNumber: "", branchCode: "", accountType: "cheque" });
  const [licenceFile, setLicenceFile] = useState<File | null>(null);
  const [bankProofFile, setBankProofFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isConfigured || !licenceFile || !bankProofFile) { setError("Complete all fields and upload both documents."); return; }
    setLoading(true); setError("");
    const parts = values.fullName.trim().split(/\s+/);
    const authResult = await signUp({ email: values.email.trim(), password: values.password, firstName: parts[0] || "Driver", lastName: parts.slice(1).join(" ") || "Partner", phone: values.phone.trim() });
    if (authResult.error) { setError(authResult.error); setLoading(false); return; }
    const form = new FormData();
    Object.entries(values).filter(([key]) => key !== "password").forEach(([key, value]) => form.append(key, value));
    form.append("licenceFile", licenceFile);
    form.append("bankProofFile", bankProofFile);
    const response = await fetch("/api/driver/register", { method: "POST", body: form });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error ?? "Could not complete registration."); setLoading(false); return; }
    router.replace(`${DRIVER_LOGIN_PATH}?registered=1`); router.refresh();
  }

  return <div className="w-full">
    {showIntro ? <><h1 className="text-2xl font-bold">Drive with Almost Anything</h1><p className="mt-2 text-sm text-neutral-500">Complete your identity, licence and banking verification before your application can be approved.</p></> : null}
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      <Section title="Personal and vehicle details">
        <Field label="Full legal name"><input required className={inputClass} value={values.fullName} onChange={(e) => update("fullName", e.target.value)} /></Field>
        <Field label="Email"><input required type="email" className={inputClass} value={values.email} onChange={(e) => update("email", e.target.value)} /></Field>
        <Field label="Phone"><input required type="tel" className={inputClass} value={values.phone} onChange={(e) => update("phone", e.target.value)} /></Field>
        <Field label="Password"><input required type="password" minLength={8} className={inputClass} value={values.password} onChange={(e) => update("password", e.target.value)} /></Field>
        <Field label="Province"><select required className={inputClass} value={values.province} onChange={(e) => update("province", e.target.value)}>{SA_PROVINCES.map((province) => <option key={province}>{province}</option>)}</select></Field>
        <Field label="Vehicle type and registration"><input required placeholder="e.g. Ford Ranger, CA 123 456" className={inputClass} value={values.vehicleNotes} onChange={(e) => update("vehicleNotes", e.target.value)} /></Field>
      </Section>
      <Section title="Driver licence">
        <Field label="Licence number"><input required className={inputClass} value={values.licenceNumber} onChange={(e) => update("licenceNumber", e.target.value)} /></Field>
        <Field label="Expiry date"><input required type="date" min={new Date().toISOString().slice(0, 10)} className={inputClass} value={values.licenceExpiry} onChange={(e) => update("licenceExpiry", e.target.value)} /></Field>
        <FileField label="Upload driver licence" hint="PDF, JPG or PNG, up to 8 MB" onChange={setLicenceFile} />
      </Section>
      <Section title="Banking details">
        <Field label="Bank name"><input required className={inputClass} value={values.bankName} onChange={(e) => update("bankName", e.target.value)} /></Field>
        <Field label="Account holder"><input required className={inputClass} value={values.accountHolder} onChange={(e) => update("accountHolder", e.target.value)} /></Field>
        <Field label="Account number"><input required inputMode="numeric" className={inputClass} value={values.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} /></Field>
        <Field label="Branch code"><input required inputMode="numeric" className={inputClass} value={values.branchCode} onChange={(e) => update("branchCode", e.target.value)} /></Field>
        <Field label="Account type"><select required className={inputClass} value={values.accountType} onChange={(e) => update("accountType", e.target.value)}><option value="cheque">Cheque or current</option><option value="savings">Savings</option><option value="transmission">Transmission</option></select></Field>
        <FileField label="Bank confirmation letter or bank statement" hint="Issued within the last 3 months. PDF, JPG or PNG, up to 8 MB" onChange={setBankProofFile} />
      </Section>
      {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button disabled={loading} className="w-full rounded-full bg-brand px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Submitting application…" : "Submit driver application"}</button>
    </form>
    <p className="mt-6 text-center text-sm text-neutral-500">Already registered? <Link href={DRIVER_LOGIN_PATH} className="font-semibold text-neutral-900 underline">Sign in</Link></p>
  </div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 sm:grid-cols-2"><legend className="px-2 text-sm font-bold text-neutral-900">{title}</legend>{children}</fieldset>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm"><span className="mb-1.5 block font-medium text-neutral-700">{label}</span>{children}</label>; }
function FileField({ label, hint, onChange }: { label: string; hint: string; onChange: (file: File | null) => void }) { return <label className="block text-sm sm:col-span-2"><span className="mb-1.5 block font-medium text-neutral-700">{label}</span><input required type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onChange(e.target.files?.[0] ?? null)} className={`${inputClass} file:mr-3 file:rounded-full file:border-0 file:bg-neutral-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`} /><span className="mt-1 block text-xs text-neutral-500">{hint}</span></label>; }
