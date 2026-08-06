import Link from "next/link";
import { CheckCircle2, Clock3, Route, Truck } from "lucide-react";
import { AccessDenied } from "@/components/admin/AccessDenied";
import { DriverOperationsDesk } from "@/components/admin/DriverOperationsDesk";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { staffCan } from "@/config/rbac";
import { getCurrentStaff } from "@/services/admin-service";
import { listDrivers } from "@/services/delivery/drivers";
import { listDeliveryJobs } from "@/services/delivery/jobs";

const ACTIVE_DELIVERY_STATUSES = new Set(["assigned", "collecting", "out_for_delivery"]);

export default async function AdminDriversPage() {
  const staff = await getCurrentStaff();
  if (!staff || !staffCan(staff, "orders.view")) {
    return <AccessDenied feature="driver operations" />;
  }

  const [drivers, jobs] = await Promise.all([
    listDrivers(),
    listDeliveryJobs({ mode: "platform_driver", limit: 200 }),
  ]);
  const canManage = staffCan(staff, "orders.manage");
  const activeJobs = jobs.filter((job) => ACTIVE_DELIVERY_STATUSES.has(job.status));
  const busyDriverIds = new Set(activeJobs.map((job) => job.driverId).filter(Boolean));
  const readyDrivers = drivers.filter(
    (driver) => driver.status === "active" && !busyDriverIds.has(driver.id),
  ).length;
  const driversOnJobs = drivers.filter(
    (driver) => driver.status === "active" && busyDriverIds.has(driver.id),
  ).length;
  const pendingDrivers = drivers.filter((driver) => driver.status === "pending").length;
  const waitingJobs = jobs.filter(
    (job) => job.status === "ready_for_driver" && !job.driverId,
  ).length;

  return (
    <>
      <PageHeader
        title="Driver operations"
        subtitle="Approve drivers, check delivery coverage, monitor current workloads and assign orders from one dispatch workspace."
        breadcrumbs={[{ label: "Admin", href: "/admin" }, { label: "Driver operations" }]}
        action={
          <Link
            href="/admin/deliveries"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
          >
            <Route className="h-4 w-4" />
            All deliveries
          </Link>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Ready to assign"
          value={String(readyDrivers)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="bg-emerald-600"
          hint="Active drivers without a current job"
        />
        <StatCard
          label="On a delivery"
          value={String(driversOnJobs)}
          icon={<Truck className="h-4 w-4" />}
          accent="bg-neutral-950"
          hint="Assigned, collecting or on the way"
        />
        <StatCard
          label="Applications"
          value={String(pendingDrivers)}
          icon={<Clock3 className="h-4 w-4" />}
          accent="bg-amber-500"
          hint="Waiting for review and verification"
        />
        <StatCard
          label="Waiting for driver"
          value={String(waitingJobs)}
          icon={<Route className="h-4 w-4" />}
          accent="bg-brand"
          hint="Orders ready to be dispatched"
        />
      </div>

      <DriverOperationsDesk drivers={drivers} jobs={jobs} canManage={canManage} />
    </>
  );
}
