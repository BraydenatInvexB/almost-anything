import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, Phone, UserRound } from "lucide-react";
import { getCurrentDriver } from "@/services/delivery/drivers";
import { getDeliveryJob } from "@/services/delivery/jobs";
import { DriverJobActions } from "@/components/driver/DriverJobActions";
import { CustomerSignatureCapture } from "@/components/driver/CustomerSignatureCapture";
import { DeliveryJobSizeBadge } from "@/components/delivery/DeliveryJobSizeBadge";

export default async function DriverJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [driver, job] = await Promise.all([getCurrentDriver(), getDeliveryJob(id)]);
  if (!driver || !job || job.driverId !== driver.id) notFound();
  const address = [job.addressLine1, job.addressLine2, job.city, job.province, job.postalCode].filter(Boolean).join(", ");

  return <div className="mx-auto max-w-4xl space-y-6">
    <Link href="/driver" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600"><ArrowLeft className="h-4 w-4" />Back to deliveries</Link>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-brand">{job.statusLabel}</p><h1 className="mt-2 text-3xl font-bold">Delivery {job.orderNumber}</h1></div><DriverJobActions jobId={job.id} status={job.status} /></div>

    <div className="grid gap-4 sm:grid-cols-2">
      <Info icon={UserRound} label="Customer" value={job.customerName ?? "Customer"} secondary={job.customerEmail} />
      <Info icon={Phone} label="Phone" value={job.customerPhone ?? "Not provided"} href={job.customerPhone ? `tel:${job.customerPhone}` : undefined} />
      <Info icon={MapPin} label="Delivery address" value={address || "Address unavailable"} href={address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : undefined} />
      <Info icon={Package} label="Items" value={job.itemSummary ?? `${job.itemCount} item${job.itemCount === 1 ? "" : "s"}`} />
    </div>
    <div className="rounded-2xl border border-neutral-200 bg-white p-5"><DeliveryJobSizeBadge label={job.deliverySizeLabel} vehicleHint={job.vehicleHint} mayNeedTwoPeople={job.mayNeedTwoPeople} /><p className="mt-4 text-sm text-neutral-500">Follow the delivery stages in order. Customer proof is required at the final handover.</p></div>
    {job.status === "out_for_delivery" ? <CustomerSignatureCapture jobId={job.id} /> : null}
    {job.status === "delivered" && job.proofRecipientName ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6"><p className="font-bold text-emerald-900">Delivery completed</p><p className="mt-1 text-sm text-emerald-800">Received by {job.proofRecipientName}{job.proofSignedAt ? ` on ${new Date(job.proofSignedAt).toLocaleString("en-ZA")}` : ""}.</p></div> : null}
  </div>;
}

function Info({ icon: Icon, label, value, secondary, href }: { icon: typeof UserRound; label: string; value: string; secondary?: string | null; href?: string }) {
  const content = <><p className="text-xs font-bold uppercase tracking-wide text-neutral-400">{label}</p><p className="mt-2 font-semibold text-neutral-900">{value}</p>{secondary ? <p className="mt-1 text-sm text-neutral-500">{secondary}</p> : null}</>;
  return <div className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100"><Icon className="h-5 w-5" /></span>{href ? <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined}>{content}</a> : <div>{content}</div>}</div>;
}
