import { type InputHTMLAttributes, forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leadingIcon?: ReactNode;
}

const fieldBase =
  "w-full rounded-xl border-2 border-black bg-white py-3 text-sm font-medium text-black placeholder:text-neutral-400 transition-all duration-150 focus:outline-none";

const focusLift = "focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#000]";
const wrapperFocusLift =
  "transition-all duration-150 focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-[3px_3px_0_0_#000]";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", leadingIcon, ...props }, ref) => {
    const inputClass = cn(
      fieldBase,
      leadingIcon ? "pl-11 pr-4" : cn("px-4", focusLift),
      error && "border-brand",
      className,
    );

    const input = <input ref={ref} type={type} className={inputClass} {...props} />;

    return (
      <div className="w-full">
        {leadingIcon ? (
          <div className={cn("relative", wrapperFocusLift)}>
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
        {error ? <p className="mt-1.5 px-2 text-xs text-red-500">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = "Input";
