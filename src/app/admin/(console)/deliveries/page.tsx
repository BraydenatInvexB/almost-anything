import Link from "next/link";
import { listDeliveryJobs } from "@/services/delivery/jobs";
import { AdminDeliveriesActions } from "@/components/admin/AdminDeliveriesActions";
import { listDrivers } from "@/services/delivery/drivers";
import type { DeliveryFulfillmentMode, DeliveryJobStatus } from "@/lib/delivery/types";

const FILTERS = [
  { href: "/admin/deliveries", label: "All" },
  { href: "/admin/deliveries?status=awaiting_seller", label: "Waiting on stores" },
  { href: "/admin/deliveries?status=ready_for_driver", label: "Need a driver" },
  { href: "/admin/deliveries?status=out_for_delivery", label: "On the way" },
  { href: "/admin/deliveries?status=delivered", label: "Delivered" },
] as const;

export default async function AdminDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; status?: string }>;
}) {
  const params = await searchParams;
  const [jobs, drivers] = await Promise.all([
    listDeliveryJobs({
      mode: params.mode as DeliveryFulfillmentMode | undefined,
      status: params.status as DeliveryJobStatus | undefined,
    }),
    listDrivers(),
  ]);
  const activeDrivers = drivers.filter((driver) => driver.status === "active");

  const waitingStores = jobs.filter((j) => j.status === "awaiting_seller").length;
  const needDriver = jobs.filter((j) => j.status === "ready_for_driver").length;
  const onTheWay = jobs.filter(
    (j) => j.status === "out_for_delivery" || j.status === "collecting" || j.status === "assigned",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Deliveries</h1>
          <p className="mt-1 max-w-xl text-sm text-neutral-500">
            Track who is delivering each order. One-store carts go to the shop; multi-store carts go
            to Almost Anything drivers — unless you change the rules.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/drivers"
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold"
          >
            Manage drivers
          </Link>
          <Link
            href="/admin/settings"
            className="rounded-lg border border-black bg-black px-3 py-2 text-xs font-semibold text-white"
          >
            Delivery rules
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Waiting on stores" value={waitingStores} hint="Shop delivers themselves" />
        <Stat label="Need a driver" value={needDriver} hint="Open for /driver queue" />
        <Stat label="In progress" value={onTheWay} hint="Collecting or out for delivery" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active =
            (f.href === "/admin/deliveries" && !params.status && !params.mode) ||
            (params.status && f.href.includes(`status=${params.status}`));
          return (
            <Link
              key={f.href}
              href={f.href}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {jobs.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            No deliveries match this filter yet.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-900">{job.orderNumber}</p>
                  <p className="mt-0.5 text-sm text-neutral-600">
                    {job.customerName}
                    {job.city ? ` · ${job.city}` : ""}
                    {job.province ? ` · ${job.province}` : ""}
                  </p>
                  <p className="mt-1 truncate text-xs text-neutral-500">{job.itemSummary}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-700">
                      {job.statusLabel}
                    </span>
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      {job.modeLabel}
                    </span>
                  </div>
                  {job.deliverySize !== "small" ? (
                    <p className="mt-2 text-[11px] text-neutral-500">
                      {job.deliverySizeLabel} — {job.vehicleHint}
                      {job.mayNeedTwoPeople ? " (2 people recommended)" : ""}
                    </p>
                  ) : null}
                  {job.driverId ? (
                    <p className="mt-2 text-xs font-medium text-neutral-700">
                      Driver: {drivers.find((driver) => driver.id === job.driverId)?.fullName ?? "Assigned driver"}
                    </p>
                  ) : null}
                </div>
                <AdminDeliveriesActions
                  jobId={job.id}
                  status={job.status}
                  assignable={job.mode === "platform_driver"}
                  assignedDriverId={job.driverId}
                  drivers={activeDrivers
                    .filter((driver) => !job.province || driver.province === job.province)
                    .map((driver) => ({ id: driver.id, name: driver.fullName, province: driver.province }))}
                />
                {job.status === "delivered" && job.proofRecipientName ? (
                  <p className="text-xs text-emerald-700">Signed by {job.proofRecipientName}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-neutral-900">{value}</p>
      <p className="mt-1 text-xs text-neutral-400">{hint}</p>
    </div>
  );
}
