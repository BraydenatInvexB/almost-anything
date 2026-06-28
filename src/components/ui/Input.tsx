import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = "text", ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-medium text-black",
            "placeholder:text-neutral-400",
            "transition-all duration-150",
            "focus:outline-none focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[3px_3px_0_0_#000]",
            error && "border-[#FF6B57]",
            className,
          )}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 px-2 text-xs text-red-500">{error}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
