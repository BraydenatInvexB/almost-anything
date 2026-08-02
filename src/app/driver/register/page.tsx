import { ConsoleLoginShell } from "@/components/auth/ConsoleLoginShell";
import { DriverRegisterForm } from "@/components/driver/DriverRegisterForm";

export default function DriverRegisterPage() {
  return (
    <ConsoleLoginShell>
      <DriverRegisterForm />
    </ConsoleLoginShell>
  );
}
