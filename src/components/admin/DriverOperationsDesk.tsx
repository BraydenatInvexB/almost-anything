"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Route,
  Search,
  ShieldCheck,
  Truck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { AdminDriversActions } from "@/components/admin/AdminDriversActions";
import { Panel, StatusBadge } from "@/components/admin/ui";
import type { DriverProfile } from "@/lib/delivery/types";
import type { DeliveryJobRow } from "@/services/delivery/jobs";
import { cn } from "@/lib/utils/cn";

const ACTIVE_JOB_STATUSES = new Set(["assigned", "collecting", "out_for_delivery"]);

type DriverFilter = "all" | "ready" | "on_delivery" | "pending" | "suspended";

const FILTERS: { id: DriverFilter; label: string }[] = [
  { id: "all", label: "All drivers" },
  { id: "ready", label: "Ready" },
  { id: "on_delivery", label: "On delivery" },
  { id: "pending", label: "Needs review" },
  { id: "suspended", label: "Suspended" },
];

export function DriverOperationsDesk({
  drivers,
  jobs,
  canManage,
}: {
  drivers: DriverProfile[];
  jobs: DeliveryJobRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const dispatchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DriverFilter>("all");
  const [preferredDriverId, setPreferredDriverId] = useState("");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const activeJobs = useMemo(
    () => jobs.filter((job) => ACTIVE_JOB_STATUSES.has(job.status)),
    [jobs],
  );
  const activeJobsByDriver = useMemo(() => {
    const map = new Map<string, DeliveryJobRow[]>();
    activeJobs.forEach((job) => {
      if (!job.driverId) return;
      map.set(job.driverId, [...(map.get(job.driverId) ?? []), job]);
    });
    return map;
  }, [activeJobs]);
  const completedByDriver = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach((job) => {
      if (job.status === "delivered" && job.driverId) {
        map.set(job.driverId, (map.get(job.driverId) ?? 0) + 1);
      }
    });
    return map;
  }, [jobs]);
  const openJobs = useMemo(
    () =>
      jobs.filter(
        (job) =>
          job.mode === "platform_driver" &&
          job.status === "ready_for_driver" &&
          !job.driverId &&
          !completedIds.includes(job.id),
      ),
    [completedIds, jobs],
  );

  const visibleDrivers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return drivers.filter((driver) => {
      const currentJobs = activeJobsByDriver.get(driver.id) ?? [];
      const matchesQuery =
        !normalizedQuery ||
        driver.fullName.toLowerCase().includes(normalizedQuery) ||
        driver.email.toLowerCase().includes(normalizedQuery) ||
        driver.phone?.toLowerCase().includes(normalizedQuery) ||
        driver.province.toLowerCase().includes(normalizedQuery);
      if (!matchesQuery) return false;
      if (filter === "ready") return driver.status === "active" && currentJobs.length === 0;
      if (filter === "on_delivery") return driver.status === "active" && currentJobs.length > 0;
      if (filter === "pending") return driver.status === "pending";
      if (filter === "suspended") return driver.status === "suspended";
      return true;
    });
  }, [activeJobsByDriver, drivers, filter, query]);

  const coverage = useMemo(() => {
    const provinces = new Set<string>();
    drivers.forEach((driver) => provinces.add(driver.province));
    openJobs.forEach((job) => {
      if (job.province) provinces.add(job.province);
    });
    return [...provinces]
      .map((province) => ({
        province,
        drivers: drivers.filter(
          (driver) => driver.status === "active" && driver.province === province,
        ).length,
        waiting: openJobs.filter((job) => job.province === province).length,
      }))
      .sort((a, b) => b.waiting - a.waiting || a.province.localeCompare(b.province));
  }, [drivers, openJobs]);

  function sendDriverToDispatch(driver: DriverProfile) {
    setPreferredDriverId(driver.id);
    setMessage(null);
    dispatchRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function eligibleDrivers(job: DeliveryJobRow) {
    return drivers.filter(
      (driver) =>
        driver.status === "active" && (!job.province || driver.province === job.province),
    );
  }

  function selectedDriverFor(job: DeliveryJobRow) {
    const eligible = eligibleDrivers(job);
    const selected = selections[job.id];
    if (selected && eligible.some((driver) => driver.id === selected)) return selected;
    if (preferredDriverId && eligible.some((driver) => driver.id === preferredDriverId)) {
      return preferredDriverId;
    }
    return "";
  }

  async function updateDelivery(
    jobId: string,
    status: DeliveryJobRow["status"],
    driverId?: string | null,
  ) {
    setUpdatingId(jobId);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/deliveries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: jobId, status, driverId }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage({ kind: "error", text: body.error ?? "Could not update this delivery." });
        return false;
      }
      router.refresh();
      return true;
    } finally {
      setUpdatingId("");
    }
  }

  async function assignJob(job: DeliveryJobRow) {
    const driverId = selectedDriverFor(job);
    if (!driverId) {
      setMessage({ kind: "error", text: `Choose a driver for ${job.orderNumber}.` });
      return;
    }
    setBusyId(job.id);
    const driver = drivers.find((entry) => entry.id === driverId);
    const updated = await updateDelivery(job.id, "assigned", driverId);
    if (updated) {
      setCompletedIds((current) => [...current, job.id]);
      setMessage({
        kind: "success",
        text: `${job.orderNumber} was assigned to ${driver?.fullName ?? "the selected driver"}.`,
      });
    }
    setBusyId("");
  }

  return (
    <div className="space-y-5">
      {message ? (
        <div
          role="status"
          className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-sm",
            message.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {message.kind === "success" ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : (
            <CircleAlert className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      ) : null}

      <Panel
        title="Delivery coverage"
        description="Active drivers and waiting orders by service province."
        action={
          <Link href="/admin/deliveries" className="text-xs font-semibold text-brand hover:underline">
            Open delivery queue
          </Link>
        }
      >
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {coverage.length ? (
            coverage.map((entry) => (
              <div
                key={entry.province}
                className={cn(
                  "rounded-xl border p-4",
                  entry.waiting > 0 && entry.drivers === 0
                    ? "border-red-200 bg-red-50/60"
                    : "border-neutral-200 bg-neutral-50/70",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-neutral-950">{entry.province}</p>
                  <MapPin className="h-4 w-4 text-neutral-400" />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="font-medium text-neutral-600">
                    <strong className="text-neutral-950">{entry.drivers}</strong> active
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      entry.waiting ? "text-brand" : "text-neutral-500",
                    )}
                  >
                    <strong>{entry.waiting}</strong> waiting
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full py-4 text-center text-sm text-neutral-500">
              Coverage will appear when drivers register or delivery jobs are created.
            </p>
          )}
        </div>
      </Panel>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <Panel title="Driver team" description="Review status, compliance and live workload.">
          <div className="border-b border-neutral-100 p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, phone or province"
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setFilter(entry.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    filter === entry.id
                      ? "bg-neutral-950 text-white"
                      : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50",
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-neutral-100">
            {visibleDrivers.length ? (
              visibleDrivers.map((driver) => {
                const currentJobs = activeJobsByDriver.get(driver.id) ?? [];
                const currentJob = currentJobs[0];
                const operationalState =
                  driver.status === "active"
                    ? currentJobs.length
                      ? "on_delivery"
                      : "ready"
                    : driver.status;
                return (
                  <article key={driver.id} className="p-4 transition hover:bg-neutral-50/60 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-sm font-bold text-white shadow-sm">
                          {initials(driver.fullName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-neutral-950">{driver.fullName}</h3>
                            <OperationalBadge state={operationalState} />
                            <VerificationBadge status={driver.verificationStatus} />
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {driver.province}
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate">{driver.email}</span>
                            </span>
                            {driver.phone ? (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" /> {driver.phone}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-lg bg-neutral-100/80 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Vehicle
                              </p>
                              <p className="mt-0.5 truncate text-xs font-medium text-neutral-700">
                                {driver.vehicleNotes || "Not supplied"}
                              </p>
                            </div>
                            <div className="rounded-lg bg-neutral-100/80 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                                Delivery record
                              </p>
                              <p className="mt-0.5 text-xs font-medium text-neutral-700">
                                {completedByDriver.get(driver.id) ?? 0} completed
                                {currentJobs.length ? ` · ${currentJobs.length} active` : " · no active jobs"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-56 lg:justify-end">
                        <Link
                          href={`/admin/drivers/${driver.id}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50"
                        >
                          {driver.status === "pending" ? "Review application" : "Open profile"}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                        {canManage && driver.status === "active" ? (
                          <button
                            type="button"
                            onClick={() => sendDriverToDispatch(driver)}
                            disabled={openJobs.length === 0}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
                          >
                            <Route className="h-3.5 w-3.5" /> Assign delivery
                          </button>
                        ) : null}
                        {canManage ? (
                          <AdminDriversActions driverId={driver.id} status={driver.status} />
                        ) : null}
                      </div>
                    </div>

                    {currentJob ? (
                      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            <Truck className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-950">
                              {currentJob.orderNumber} · {currentJob.statusLabel}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-neutral-500">
                              {currentJob.collectionStops.length} collection{currentJob.collectionStops.length === 1 ? "" : "s"} · {currentJob.customerName || "Customer"} · {destination(currentJob)}
                            </p>
                          </div>
                        </div>
                        <Link
                          href="/admin/deliveries"
                          className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand hover:underline"
                        >
                          Manage route <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    ) : null}
                  </article>
                );
              })
            ) : (
              <div className="px-5 py-14 text-center">
                <UsersRound className="mx-auto h-7 w-7 text-neutral-300" />
                <p className="mt-3 text-sm font-semibold text-neutral-800">No matching drivers</p>
                <p className="mt-1 text-xs text-neutral-500">Try another search or status filter.</p>
              </div>
            )}
          </div>
        </Panel>

        <div ref={dispatchRef} className="scroll-mt-6">
          <Panel
            title="Dispatch queue"
            description="Orders ready for an Almost Anything driver."
            action={
              <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">
                {openJobs.length} waiting
              </span>
            }
          >
            {preferredDriverId ? (
              <div className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-lg border border-brand/20 bg-brand/[0.04] px-3 py-2">
                <p className="text-xs text-neutral-700">
                  Assigning for <strong>{drivers.find((driver) => driver.id === preferredDriverId)?.fullName}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setPreferredDriverId("")}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : null}

            <div className="divide-y divide-neutral-100">
              {openJobs.length ? (
                openJobs.map((job) => {
                  const eligible = eligibleDrivers(job);
                  const selected = selectedDriverFor(job);
                  return (
                    <article key={job.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-950">{job.orderNumber}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                            <MapPin className="h-3 w-3 shrink-0" /> {destination(job)}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                          {job.deliverySizeLabel}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                        {job.itemSummary || `${job.itemCount} item${job.itemCount === 1 ? "" : "s"}`}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-400">
                        <Clock3 className="h-3 w-3" /> Waiting {relativeTime(job.createdAt)}
                        <span>·</span>
                        <span>{job.collectionStops.length} collection{job.collectionStops.length === 1 ? "" : "s"}</span>
                        <span>·</span>
                        <span>{job.vehicleHint}</span>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_auto]">
                        <select
                          aria-label={`Driver for ${job.orderNumber}`}
                          value={selected}
                          disabled={!canManage || busyId === job.id || eligible.length === 0}
                          onChange={(event) =>
                            setSelections((current) => ({ ...current, [job.id]: event.target.value }))
                          }
                          className="h-9 min-w-0 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-700 outline-none focus:border-neutral-400 disabled:bg-neutral-100"
                        >
                          <option value="">
                            {eligible.length ? "Choose a driver" : `No active driver in ${job.province || "this area"}`}
                          </option>
                          {eligible.map((driver) => {
                            const workload = activeJobsByDriver.get(driver.id)?.length ?? 0;
                            return (
                              <option key={driver.id} value={driver.id}>
                                {driver.fullName} {workload ? `(${workload} active)` : "(ready)"}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          disabled={!canManage || !selected || busyId === job.id}
                          onClick={() => void assignJob(job)}
                          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-neutral-950 px-3 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
                        >
                          {busyId === job.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Route className="h-3.5 w-3.5" />
                          )}
                          Assign
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="px-5 py-14 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Check className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-neutral-900">Dispatch queue is clear</p>
                  <p className="mt-1 text-xs text-neutral-500">New ready orders will appear here.</p>
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Deliveries in progress"
        description="Live operational view of every assigned route. Customer signatures are captured by the driver at handover."
        action={
          <Link href="/admin/deliveries" className="text-xs font-semibold text-brand hover:underline">
            Manage all deliveries
          </Link>
        }
      >
        {activeJobs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr>
                  {['Delivery', 'Driver', 'Customer', 'Destination', 'Status', 'Next action'].map((label) => (
                    <th
                      key={label}
                      className="bg-neutral-50/80 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-neutral-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {activeJobs.map((job) => {
                  const driver = drivers.find((entry) => entry.id === job.driverId);
                  return (
                    <tr key={job.id} className="hover:bg-neutral-50/60">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-neutral-950">{job.orderNumber}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{job.itemCount} item{job.itemCount === 1 ? "" : "s"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-neutral-800">{driver?.fullName ?? "Unassigned"}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{driver?.phone || driver?.province || ""}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-neutral-800">{job.customerName || "Customer"}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">{job.customerPhone || job.customerEmail || ""}</p>
                      </td>
                      <td className="px-5 py-4 text-xs text-neutral-600">{destination(job)}</td>
                      <td className="px-5 py-4"><StatusBadge status={job.status} /></td>
                      <td className="px-5 py-4">
                        {canManage && (job.status === "assigned" || job.status === "collecting") ? (
                          <button
                            type="button"
                            disabled={updatingId === job.id}
                            onClick={() =>
                              void updateDelivery(
                                job.id,
                                job.status === "assigned" ? "collecting" : "out_for_delivery",
                                job.driverId,
                              )
                            }
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
                          >
                            {updatingId === job.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : job.status === "assigned" ? (
                              <Truck className="h-3.5 w-3.5" />
                            ) : (
                              <Route className="h-3.5 w-3.5" />
                            )}
                            {job.status === "assigned" ? "Start collection" : "Mark on the way"}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500">
                            <FileCheck2 className="h-3.5 w-3.5" /> Await signed handover
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Truck className="mx-auto h-7 w-7 text-neutral-300" />
            <p className="mt-3 text-sm font-semibold text-neutral-800">No deliveries in progress</p>
            <p className="mt-1 text-xs text-neutral-500">Assigned routes will be monitored here.</p>
          </div>
        )}
      </Panel>

      {!canManage ? (
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
          <ShieldCheck className="h-4 w-4" /> You have view access. Driver approval and delivery assignment require order management permission.
        </div>
      ) : null}
    </div>
  );
}

function OperationalBadge({ state }: { state: string }) {
  const meta =
    state === "ready"
      ? { label: "Ready", className: "bg-emerald-50 text-emerald-700 ring-emerald-100" }
      : state === "on_delivery"
        ? { label: "On delivery", className: "bg-blue-50 text-blue-700 ring-blue-100" }
        : state === "pending"
          ? { label: "Needs review", className: "bg-amber-50 text-amber-700 ring-amber-100" }
          : state === "suspended"
            ? { label: "Suspended", className: "bg-red-50 text-red-700 ring-red-100" }
            : { label: state, className: "bg-neutral-100 text-neutral-600 ring-neutral-200" };
  return (
    <span className={cn("inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ring-1", meta.className)}>
      {meta.label}
    </span>
  );
}

function VerificationBadge({ status }: { status: DriverProfile["verificationStatus"] }) {
  const approved = status === "approved";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ring-1",
        approved
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : status === "rejected"
            ? "bg-red-50 text-red-700 ring-red-100"
            : "bg-neutral-100 text-neutral-600 ring-neutral-200",
      )}
    >
      {approved ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
      {approved ? "Verified" : status === "incomplete" ? "Documents incomplete" : status}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "DR";
}

function destination(job: DeliveryJobRow) {
  return [job.city, job.province].filter(Boolean).join(", ") || "Address pending";
}

function relativeTime(iso: string) {
  const elapsed = Math.max(0, Date.now() - new Date(iso).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}
