import { listDrivers } from "@/services/delivery/drivers";
import { AdminDriversActions } from "@/components/admin/AdminDriversActions";
import Link from "next/link";

export default async function AdminDriversPage() {
  const drivers = await listDrivers();
  const pending = drivers.filter((d) => d.status === "pending").length;
  const active = drivers.filter((d) => d.status === "active").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Drivers</h1>
        <p className="mt-1 text-sm text-neutral-500">
          People who sign up at /driver to deliver multi-store orders in their province. Approve them
          here before they can claim jobs.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pending approval</p>
          <p className="mt-1 text-3xl font-black">{pending}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Active drivers</p>
          <p className="mt-1 text-3xl font-black">{active}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        {drivers.length === 0 ? (
          <div className="p-10 text-center text-sm text-neutral-500">
            No drivers yet. Share <span className="font-mono">/driver/register</span> to invite signups.
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {drivers.map((driver) => (
              <li key={driver.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-neutral-900">{driver.fullName}</p>
                  <p className="text-sm text-neutral-600">
                    {driver.email}
                    {driver.phone ? ` · ${driver.phone}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {driver.province} · {driver.status}
                    {driver.vehicleNotes ? ` · ${driver.vehicleNotes}` : ""}
                  </p>
                  <p className="mt-1 text-xs font-medium capitalize text-neutral-500">Verification: {driver.verificationStatus}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/drivers/${driver.id}`} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold hover:bg-neutral-50">Review application</Link>
                  <AdminDriversActions driverId={driver.id} status={driver.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
