interface ProcessingIndicatorProps {
  message?: string;
}

export function ProcessingIndicator({
  message = "Processing...",
}: ProcessingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-assistant-bubble rounded-xl">
      <div className="flex gap-1">
        <span
          className="w-2 h-2 bg-wildlife-green rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 bg-wildlife-green rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 bg-wildlife-green rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-sm text-secondary-text">{message}</span>
    </div>
  );
}
