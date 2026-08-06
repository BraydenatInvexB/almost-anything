import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, ShieldCheck } from "lucide-react";
import { getCurrentDriver } from "@/services/delivery/drivers";
import { getDeliveryJob } from "@/services/delivery/jobs";
import { DriverJobActions } from "@/components/driver/DriverJobActions";
import { CustomerSignatureCapture } from "@/components/driver/CustomerSignatureCapture";
import { DeliveryJobSizeBadge } from "@/components/delivery/DeliveryJobSizeBadge";
import { DeliveryRouteManifest } from "@/components/delivery/DeliveryRouteManifest";

export default async function DriverJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [driver, job] = await Promise.all([getCurrentDriver(), getDeliveryJob(id)]);
  if (!driver || !job || job.driverId !== driver.id) notFound();

  return <div className="mx-auto max-w-5xl space-y-6">
    <Link href="/driver" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600"><ArrowLeft className="h-4 w-4" />Back to deliveries</Link>
    <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-7"><div><p className="text-xs font-bold uppercase tracking-widest text-brand">{job.statusLabel}</p><h1 className="mt-2 text-3xl font-bold">Delivery {job.orderNumber}</h1><p className="mt-2 text-sm text-neutral-500">Complete every collection in order, then deliver to the customer and capture their signature.</p></div><DriverJobActions jobId={job.id} status={job.status} /></div>

    <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-col gap-3 border-b border-neutral-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div><p className="flex items-center gap-2 text-sm font-bold text-neutral-950"><ClipboardList className="h-4 w-4 text-brand" /> Collection and delivery route</p><p className="mt-1 text-xs text-neutral-500">Store contacts and addresses are shown below. Map buttons open the exact stop address.</p></div>
        <DeliveryJobSizeBadge label={job.deliverySizeLabel} vehicleHint={job.vehicleHint} mayNeedTwoPeople={job.mayNeedTwoPeople} />
      </div>
      <DeliveryRouteManifest job={job} />
    </section>
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" /><p>Customer contact details are for this delivery only. Customer proof and signature are required at the final handover.</p></div>
    {job.status === "out_for_delivery" ? <CustomerSignatureCapture jobId={job.id} /> : null}
    {job.status === "delivered" && job.proofRecipientName ? <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6"><p className="font-bold text-emerald-900">Delivery completed</p><p className="mt-1 text-sm text-emerald-800">Received by {job.proofRecipientName}{job.proofSignedAt ? ` on ${new Date(job.proofSignedAt).toLocaleString("en-ZA")}` : ""}.</p></div> : null}
  </div>;
}
