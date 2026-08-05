export function ConsoleLoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f9f9f9]">
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-7 shadow-[var(--shadow-card)] sm:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
