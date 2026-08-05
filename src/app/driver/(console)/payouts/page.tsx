import { getCurrentDriver } from "@/services/delivery/drivers";
import { getDriverCompliance } from "@/services/delivery/compliance";
import { getDriverPayoutSummary } from "@/services/delivery/payouts";
import { DriverPayoutDesk } from "@/components/driver/DriverPayoutDesk";

export default async function DriverPayoutsPage() {
  const driver = await getCurrentDriver();
  if (!driver) return null;
  const [summary, compliance] = await Promise.all([getDriverPayoutSummary(driver.id), getDriverCompliance(driver.id)]);
  return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-widest text-brand">Driver earnings</p><h1 className="mt-2 text-2xl font-bold">Earnings and payouts</h1><p className="mt-1 text-sm text-neutral-500">Track completed deliveries and request money from your available balance.</p></div><DriverPayoutDesk summary={summary} canRequest={driver.status === "active" && compliance.readyForApproval} /></div>;
}
