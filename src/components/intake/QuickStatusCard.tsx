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

  const getUrgencyStyle = (hoursAgo: number | null): React.CSSProperties => {
    if (hoursAgo === null) return { color: "var(--color-text-muted)" };
    if (hoursAgo > 4) return { color: "var(--color-error)", fontWeight: 600 };
    if (hoursAgo > 2) return { color: "var(--color-brand-accent)" };
    return { color: "var(--color-text-secondary)" };
  };

  return (
    <Card variant="bordered" className="animate-fadeIn overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3
            className="font-title text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Quick Status
          </h3>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {totalUnderCare} under care
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.intakeNumber}
              className="flex items-center gap-3 py-2 px-2 rounded-lg transition-colors"
              style={{
                cursor: onViewAnimal ? "pointer" : undefined,
              }}
              onClick={() => onViewAnimal?.(item.intakeNumber)}
              onMouseEnter={(e) => {
                if (onViewAnimal)
                  e.currentTarget.style.backgroundColor =
                    "var(--color-bg-tertiary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {/* Intake number */}
              <span
                className="font-mono text-xs flex-shrink-0"
                style={{ color: "var(--color-text-muted)" }}
              >
                {item.intakeNumber}
              </span>

              {/* Species */}
              <span
                className="text-sm flex-1 min-w-0 truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {item.species}
              </span>

              {/* Weight + trend */}
              <span
                className="text-sm flex-shrink-0"
                style={{ color: getTrendColor(item.weightTrend) }}
              >
                {item.lastWeight ? (
                  <>
                    {item.lastWeight} {getTrendIcon(item.weightTrend)}
                  </>
                ) : (
                  <span style={{ color: "var(--color-text-muted)" }}>&mdash;</span>
                )}
              </span>

              {/* Time since last log */}
              <span className="text-xs flex-shrink-0" style={getUrgencyStyle(item.hoursAgo)}>
                {item.hoursAgo !== null ? `${item.hoursAgo}h ago` : "No logs"}
              </span>
            </div>
          ))}
        </div>

        {/* Hint */}
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Tap a row for details.
        </p>
      </div>
    </Card>
  );
}
