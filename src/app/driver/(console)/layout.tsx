import { redirect } from "next/navigation";
import { getCurrentDriver } from "@/services/delivery/drivers";
import { DriverShell } from "@/components/driver/DriverShell";
import { DRIVER_LOGIN_PATH } from "@/config/console-auth";

export default async function DriverConsoleLayout({ children }: { children: React.ReactNode }) {
  const driver = await getCurrentDriver();
  if (!driver) redirect(DRIVER_LOGIN_PATH);

  return <DriverShell driver={driver}>{children}</DriverShell>;
}
