import { ConsoleLoginShell } from "@/components/auth/ConsoleLoginShell";
import { SellerLoginPanel } from "@/components/auth/SellerLoginPanel";

export default function SellerLoginPage() {
  return (
    <ConsoleLoginShell>
      <SellerLoginPanel />
    </ConsoleLoginShell>
  );
}
