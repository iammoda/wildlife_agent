"use client";

import { QuickStatusItem } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface QuickStatusCardProps {
  items: QuickStatusItem[];
  totalUnderCare: number;
}

export function QuickStatusCard({
  items,
  totalUnderCare,
}: QuickStatusCardProps) {
  const getTrendIcon = (trend: QuickStatusItem["weightTrend"]) => {
    switch (trend) {
      case "up":
        return "up";
      case "down":
        return "down";
      case "stable":
        return "flat";
      default:
        return "";
    }
  };

  const getTrendColor = (trend: QuickStatusItem["weightTrend"]) => {
    switch (trend) {
      case "up":
        return "var(--color-brand-primary)";
      case "down":
        return "#EF4444";
      case "stable":
        return "var(--color-text-secondary)";
      default:
        return "var(--color-text-muted)";
    }
  };

  const getUrgencyStyle = (hoursAgo: number | null) => {
    if (hoursAgo === null) return { color: "var(--color-text-muted)" };
    if (hoursAgo > 4) return { color: "#EF4444", fontWeight: "600" };
    if (hoursAgo > 2) return { color: "#F59E0B" };
    return { color: "var(--color-text-secondary)" };
  };

  return (
    <Card variant="bordered" className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Quick Status
        </h3>
        <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {totalUnderCare} under care
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.intakeNumber}
            className="flex items-center justify-between py-2 border-b last:border-0"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div>
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                {item.intakeNumber}
              </span>
              <span className="ml-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {item.species}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm">
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
      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
        Tip: Say "show me [number]" for details or "fed [number]" to log care.
      </p>
    </Card>
  );
}
