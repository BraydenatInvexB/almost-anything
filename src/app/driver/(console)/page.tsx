import { Banknote, Package } from "lucide-react";
import { getCurrentDriver } from "@/services/delivery/drivers";
import { listJobsForDriver, type DeliveryJobRow } from "@/services/delivery/jobs";
import { DriverJobActions } from "@/components/driver/DriverJobActions";
import { DeliveryJobSizeBadge } from "@/components/delivery/DeliveryJobSizeBadge";

export default async function DriverDashboardPage() {
  const driver = await getCurrentDriver();
  if (!driver) return null;

  const { available, mine } = await listJobsForDriver(driver);
  const pendingApproval = driver.status === "pending";
  const blocked = driver.status === "suspended" || driver.status === "rejected";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Deliveries in {driver.province}</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Claim open multi-store jobs in your province, collect from the shops, and deliver to the
          customer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5"><Package className="h-5 w-5 text-brand" /><p className="mt-4 text-sm text-neutral-500">Standard delivery</p><p className="mt-1 text-3xl font-bold">R100</p></div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5"><Banknote className="h-5 w-5 text-brand" /><p className="mt-4 text-sm text-neutral-500">Large-item delivery</p><p className="mt-1 text-3xl font-bold">R200</p></div>
      </div>

      {pendingApproval ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your account is waiting for admin approval. You&apos;ll be able to claim jobs once approved.
        </div>
      ) : null}
      {blocked ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Your driver account is {driver.status}. Contact Almost Anything support if this is a mistake.
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">Open in your province</h2>
        <JobList
          jobs={available}
          empty="No open jobs in your province right now."
          canClaim={driver.status === "active"}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">Your jobs</h2>
        <JobList jobs={mine} empty="You have no claimed or completed jobs yet." />
      </section>
    </div>
  );
}

function JobList({
  jobs,
  empty,
  canClaim,
}: {
  jobs: DeliveryJobRow[];
  empty: string;
  canClaim?: boolean;
}) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
        {empty}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
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
            <p className="mt-2 text-sm font-bold text-neutral-900">
              Earn {job.deliverySize === "small" ? "R100" : "R200"}
            </p>
            <p className="mt-2 inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold">
              {job.statusLabel}
            </p>
            <DeliveryJobSizeBadge
              label={job.deliverySizeLabel}
              vehicleHint={job.vehicleHint}
              mayNeedTwoPeople={job.mayNeedTwoPeople}
            />
          </div>
          <DriverJobActions jobId={job.id} status={job.status} canClaim={canClaim} />
        </li>
      ))}
    </ul>
  );
}
