import { ConsoleLoginShell } from "@/components/auth/ConsoleLoginShell";
import { DriverLoginPanel } from "@/components/auth/DriverLoginPanel";
import { getPublicStorefrontConfig } from "@/services/storefront-settings-service";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export default async function DriverLoginPage() {
  await connection();
  const config = await getPublicStorefrontConfig();
  if (config.driverPortalEnabled === false) redirect("/");
  return (
    <ConsoleLoginShell>
      <DriverLoginPanel />
    </ConsoleLoginShell>
  );
}
