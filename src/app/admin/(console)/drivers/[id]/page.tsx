import Link from "next/link";
import { notFound } from "next/navigation";
import { listDrivers } from "@/services/delivery/drivers";
import { getDriverCompliance } from "@/services/delivery/compliance";
import { getDriverPayoutSummary } from "@/services/delivery/payouts";
import { AdminDriversActions } from "@/components/admin/AdminDriversActions";
import { AdminDriverCompliancePanel } from "@/components/admin/AdminDriverCompliancePanel";

export default async function AdminDriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const driver = (await listDrivers()).find((row) => row.id === id);
  if (!driver) notFound();
  const [detail, payouts] = await Promise.all([getDriverCompliance(id), getDriverPayoutSummary(id)]);
  return <div className="space-y-6">
    <Link href="/admin/drivers" className="text-sm font-semibold text-neutral-600">← Back to drivers</Link>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">{driver.fullName}</h1><p className="mt-1 text-sm text-neutral-500">{driver.email} · {driver.phone} · {driver.province}</p></div><AdminDriversActions driverId={driver.id} status={driver.status} /></div>
    <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="font-bold">Licence details</h2><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-neutral-500">Number</dt><dd className="font-semibold">{detail.licenceNumber || "Not supplied"}</dd></div><div><dt className="text-neutral-500">Expiry</dt><dd className="font-semibold">{detail.licenceExpiry || "Not supplied"}</dd></div><div><dt className="text-neutral-500">Vehicle</dt><dd className="font-semibold">{driver.vehicleNotes || "Not supplied"}</dd></div></dl></section><section className="rounded-2xl border border-neutral-200 bg-white p-5"><h2 className="font-bold">Banking details</h2>{detail.banking ? <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-neutral-500">Bank</dt><dd className="font-semibold">{detail.banking.bankName}</dd></div><div><dt className="text-neutral-500">Account holder</dt><dd className="font-semibold">{detail.banking.accountHolder}</dd></div><div><dt className="text-neutral-500">Account number</dt><dd className="font-semibold">{detail.banking.accountNumber}</dd></div><div><dt className="text-neutral-500">Branch and type</dt><dd className="font-semibold">{detail.banking.branchCode} · {detail.banking.accountType}</dd></div></dl> : <p className="mt-3 text-sm text-neutral-500">No banking details supplied.</p>}</section></div>
    <div className="grid gap-3 sm:grid-cols-4">{[["Total earned", payouts.earned],["Available", payouts.available],["Committed", payouts.committed],["Paid", payouts.paid]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-white p-4"><p className="text-xs font-semibold text-neutral-500">{label}</p><p className="mt-1 text-2xl font-bold">R {Number(value).toFixed(2)}</p></div>)}</div>
    <AdminDriverCompliancePanel detail={detail} payouts={payouts} />
  </div>;
}
