"use client";

import { QuickStatusItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface QuickStatusCardProps {
  items: QuickStatusItem[];
  totalUnderCare: number;
  onViewAnimal?: (intakeNumber: string) => void;
}

export function QuickStatusCard({
  items,
  totalUnderCare,
  onViewAnimal,
}: QuickStatusCardProps) {
  const getTrendIcon = (trend: QuickStatusItem["weightTrend"]) => {
    switch (trend) {
      case "up":
        return "\u2191";
      case "down":
        return "\u2193";
      case "stable":
        return "\u2192";
      default:
        return "";
    }
  };

  const getTrendColor = (trend: QuickStatusItem["weightTrend"]) => {
    switch (trend) {
      case "up":
        return "var(--color-success)";
      case "down":
        return "var(--color-error)";
      case "stable":
        return "var(--color-text-secondary)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getUrgencyStyle = (hoursAgo: number | null) => {
    if (hoursAgo === null) return { color: "var(--color-text-muted)" };
    if (hoursAgo > 4) return { color: "var(--color-error)", fontWeight: "600" };
    if (hoursAgo > 2) return { color: "var(--color-brand-accent)" };
    return { color: "var(--color-text-secondary)" };
  };

  return (
    <Card variant="bordered" className="space-y-3 animate-fadeIn card-accent-top">
      <div className="flex items-center justify-between">
        <h3 className="font-title text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Quick Status
        </h3>
        <span
          className="intake-pill text-xs"
          style={{
            backgroundColor: "var(--color-brand-light)",
            color: "var(--color-brand-accent)",
          }}
        >
          {totalUnderCare} under care
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.intakeNumber}
            className={`intake-row-accent flex flex-col gap-2 px-3 py-2 border-b last:border-0 sm:flex-row sm:items-center sm:justify-between${onViewAnimal ? " cursor-pointer transition-colors hover:bg-[var(--color-bg-tertiary)]" : ""}`}
            style={{ borderColor: "var(--color-border-light)" }}
            onClick={() => onViewAnimal?.(item.intakeNumber)}
          >
            <div>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                {item.intakeNumber}
              </span>
              <span className="ml-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {item.species}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm sm:gap-4">
              {item.lastWeight && (
                <span style={{ color: getTrendColor(item.weightTrend) }}>
                  {item.lastWeight} {getTrendIcon(item.weightTrend)}
                </span>
              )}
              <span style={getUrgencyStyle(item.hoursAgo)}>
                {item.hoursAgo !== null ? `${item.hoursAgo}h ago` : "No logs"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="hint-row text-xs">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-icon inline-icon-muted"
          aria-hidden="true"
        >
          <path
            d="M8 14C11.3137 14 14 11.3137 14 8C10.6863 8 8 10.6863 8 14Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M8 14C8 10.6863 5.31371 8 2 8C2 11.3137 4.68629 14 8 14Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
        Tip: Click a row or say "show me [number]" for details.
      </p>
    </Card>
  );
}
