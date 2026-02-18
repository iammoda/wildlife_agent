"use client";

import { SummaryStats } from "@/lib/types";

interface SummaryBarProps {
  stats: SummaryStats | null;
  isLoading: boolean;
}

export function SummaryBar({ stats, isLoading }: SummaryBarProps) {
  if (isLoading) {
    return (
      <div 
        className="px-4 py-3 text-center"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div 
          className="h-4 w-48 mx-auto rounded animate-pulse"
          style={{ backgroundColor: "var(--color-bg-tertiary)" }}
        />
      </div>
    );
  }

  if (!stats || stats.total_intakes === 0) {
    return (
      <div 
        className="px-4 py-3 text-center text-sm"
        style={{ 
          backgroundColor: "var(--color-bg-primary)",
          color: "var(--color-text-secondary)"
        }}
      >
        No intakes yet. Start by recording your first intake!
      </div>
    );
  }

  return (
    <div 
      className="px-4 py-3 text-center text-sm"
      style={{ 
        backgroundColor: "var(--color-bg-primary)",
        color: "var(--color-text-secondary)"
      }}
    >
      <span 
        className="font-medium"
        style={{ color: "var(--color-brand-primary)" }}
      >
        {stats.animals_under_care}
      </span>{" "}
      animals under care
      <span className="mx-2" style={{ color: "var(--color-text-muted)" }}>·</span>
      <span 
        className="font-medium"
        style={{ color: "var(--color-brand-primary)" }}
      >
        {stats.intakes_this_week}
      </span>{" "}
      intakes this week
    </div>
  );
}
