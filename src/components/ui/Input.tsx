import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text-primary)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl
            input-base
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${error ? "!border-[var(--color-error)]" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p
            className="mt-1.5 text-sm"
            style={{ color: "var(--color-error)" }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
