import { type InputHTMLAttributes, forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leadingIcon?: ReactNode;
}

const fieldBase =
  "w-full rounded-xl border border-neutral-200 bg-white py-3 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", leadingIcon, ...props }, ref) => {
    const inputClass = cn(
      fieldBase,
      leadingIcon ? "pl-11 pr-4" : "px-4",
      error && "border-brand focus:ring-brand/20",
      className,
    );

    const input = <input ref={ref} type={type} className={inputClass} {...props} />;

    return (
      <div className="w-full">
        {leadingIcon ? (
          <div className="relative">
            <span
              className="pointer-events-none absolute left-4 top-1/2 z-10 flex -translate-y-1/2 items-center text-neutral-400"
              aria-hidden
            >
              {leadingIcon}
            </span>
            {input}
          </div>
        ) : (
          input
        )}
        {error ? <p className="mt-1.5 px-2 text-xs text-brand">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
