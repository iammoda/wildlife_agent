interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorMessageProps) {
  return (
    <div
      className="flex flex-col gap-2 px-4 py-3 rounded-xl"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--color-error) 12%, var(--color-bg-secondary))",
        border: "1px solid color-mix(in srgb, var(--color-error) 20%, transparent)",
      }}
    >
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "var(--color-error)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-medium" style={{ color: "var(--color-error)" }}>
          {title}
        </span>
      </div>
      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="self-start mt-1 text-sm hover:underline"
          style={{ color: "var(--color-brand-accent)" }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
