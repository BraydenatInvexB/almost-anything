import { ConsoleLoginShell } from "@/components/auth/ConsoleLoginShell";
import { DriverLoginPanel } from "@/components/auth/DriverLoginPanel";

export default function DriverLoginPage() {
  return (
    <ConsoleLoginShell>
      <DriverLoginPanel />
    </ConsoleLoginShell>
  );
}
