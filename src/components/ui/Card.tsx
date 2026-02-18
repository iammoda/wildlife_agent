import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = "default", className = "", style, ...props }, ref) => {
    // Base styling with CSS variables
    const baseStyle: React.CSSProperties = {
      backgroundColor: "var(--color-bg-card)",
      color: "var(--color-text-primary)",
    };

    const variantStyle: React.CSSProperties =
      variant === "bordered"
        ? { border: "1px solid var(--color-border)" }
        : variant === "elevated"
        ? { boxShadow: "var(--shadow-lg)" }
        : { boxShadow: "var(--shadow-sm)" };

    return (
      <div
        ref={ref}
        className={`rounded-xl p-4 ${className}`}
        style={{ ...baseStyle, ...variantStyle, ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
