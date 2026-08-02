import { getCurrentSeller } from "@/services/seller-service";
import { listDeliveryJobs, type DeliveryJobRow } from "@/services/delivery/jobs";
import { SellerDeliveryActions } from "@/components/seller/SellerDeliveryActions";
import { DeliveryJobSizeBadge } from "@/components/delivery/DeliveryJobSizeBadge";

export default async function SellerOrdersPage() {
  const seller = await getCurrentSeller();
  if (!seller) return null;

  const jobs = await listDeliveryJobs({ sellerId: seller.id, limit: 50 });
  const selfJobs = jobs.filter((j) => j.mode === "seller_self");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Orders & deliveries</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          When a customer orders only from your store, you handle delivery yourself. Mark orders out
          for delivery and delivered here.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {selfJobs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg font-semibold text-neutral-900">No store deliveries yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              Single-store checkouts assigned to you will show up here. Multi-store orders are handled
              by Almost Anything drivers.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {selfJobs.map((job) => (
              <SellerOrderRow key={job.id} job={job} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SellerOrderRow({ job }: { job: DeliveryJobRow }) {
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-neutral-900">{job.orderNumber}</p>
        <p className="text-sm text-neutral-600">
          {job.customerName}
          {job.customerPhone ? ` · ${job.customerPhone}` : ""}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {[job.addressLine1, job.city, job.province, job.postalCode].filter(Boolean).join(", ")}
        </p>
        <p className="mt-1 truncate text-xs text-neutral-500">{job.itemSummary}</p>
        <p className="mt-2 inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold">
          {job.statusLabel}
        </p>
        <DeliveryJobSizeBadge
          label={job.deliverySizeLabel}
          vehicleHint={job.vehicleHint}
          mayNeedTwoPeople={job.mayNeedTwoPeople}
        />
      </div>
      <SellerDeliveryActions jobId={job.id} status={job.status} />
    </li>
  );
}
