import { SiteLogo } from "@/components/layout/SiteLogo";

export function ConsoleLoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-100">
      <header className="border-b-[3px] border-black bg-white">
        <div className="mx-auto max-w-md px-4 py-4 sm:px-6">
          <SiteLogo variant="compact" />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full overflow-hidden rounded-[28px] border-[3px] border-black bg-white p-7 shadow-[8px_8px_0_0_#000] sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
