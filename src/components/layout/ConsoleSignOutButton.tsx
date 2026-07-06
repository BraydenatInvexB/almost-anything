"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthProvider";
import { cn } from "@/lib/utils/cn";

export function ConsoleSignOutButton({
  redirectTo = "/",
  variant = "sidebar",
  className,
}: {
  redirectTo?: string;
  variant?: "sidebar" | "header";
  className?: string;
}) {
  const { signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push(redirectTo);
    router.refresh();
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900",
          className,
        )}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className={cn(
        "mt-2 flex w-full items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900",
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
