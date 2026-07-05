export function ProductFormField({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-xs font-semibold text-neutral-600">{label}</span>
      {hint ? <span className="text-[11px] text-neutral-400">{hint}</span> : null}
      {children}
    </label>
  );
}
