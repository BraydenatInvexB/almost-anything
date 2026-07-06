import { ConsoleLoginShell } from "@/components/auth/ConsoleLoginShell";
import { AdminLoginPanel } from "@/components/auth/AdminLoginPanel";

export default function AdminLoginPage() {
  return (
    <ConsoleLoginShell>
      <AdminLoginPanel />
    </ConsoleLoginShell>
  );
}
