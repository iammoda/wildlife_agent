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
    <div className="flex flex-col gap-2 px-4 py-3 bg-red-50 border border-error-red/20 rounded-xl">
      <div className="flex items-center gap-2">
        <svg
          className="w-5 h-5 text-error-red"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="font-medium text-error-red">{title}</span>
      </div>
      <p className="text-sm text-gray-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="self-start mt-1 text-sm text-wildlife-green hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
