"use client";

import { useState } from "react";
import { DailyBriefingAlert } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface DailyBriefingCardProps {
  alerts: DailyBriefingAlert[];
  totalUnderCare: number;
  animalsWithAlerts: number;
  animalsAllClear: number;
  onViewAnimal?: (intakeNumber: string) => void;
}

export function DailyBriefingCard({
  alerts,
  totalUnderCare,
  animalsWithAlerts,
  animalsAllClear,
  onViewAnimal,
}: DailyBriefingCardProps) {
  const [showAllClear, setShowAllClear] = useState(false);

  // Group alerts by animal
  const alertsByAnimal = new Map<
    string,
    { species: string; alerts: DailyBriefingAlert[] }
  >();
  for (const alert of alerts) {
    const existing = alertsByAnimal.get(alert.intakeNumber);
    if (existing) {
      existing.alerts.push(alert);
    } else {
      alertsByAnimal.set(alert.intakeNumber, {
        species: alert.species,
        alerts: [alert],
      });
    }
  }

  // Split into concern animals vs all-clear (positive-only) animals
  const concernAnimals: [string, { species: string; alerts: DailyBriefingAlert[] }][] = [];
  const clearAnimals: [string, { species: string; alerts: DailyBriefingAlert[] }][] = [];

  for (const [intakeNumber, data] of alertsByAnimal) {
    const hasConcern = data.alerts.some(
      (a) => a.severity === "critical" || a.severity === "warning" || a.severity === "info"
    );
    if (hasConcern) {
      concernAnimals.push([intakeNumber, data]);
    } else {
      clearAnimals.push([intakeNumber, data]);
    }
  }

  const getSeverityIcon = (severity: DailyBriefingAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "\u26A0";
      case "warning":
        return "\u26A0";
      case "positive":
        return "\u2191";
      case "info":
        return "\u2022";
    }
  };

  const getSeverityColor = (severity: DailyBriefingAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return "var(--color-error)";
      case "warning":
        return "var(--color-brand-accent)";
      case "positive":
        return "var(--color-success)";
      case "info":
        return "var(--color-text-muted)";
    }
  };

  const allClear = concernAnimals.length === 0;

  return (
    <Card variant="bordered" className="animate-fadeIn overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3
            className="font-title text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Daily Briefing
          </h3>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {totalUnderCare} under care
          </span>
        </div>

        {/* All-clear message */}
        {allClear && (
          <p
            className="text-sm py-2"
            style={{ color: "var(--color-success)" }}
          >
            All {totalUnderCare} animals under care look good — no concerns
            detected.
          </p>
        )}

        {/* Concern animals */}
        {concernAnimals.length > 0 && (
          <div className="space-y-1">
            <p
              className="text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              {animalsWithAlerts} need{animalsWithAlerts === 1 ? "s" : ""} attention
            </p>
            <div className="space-y-3">
              {concernAnimals.map(([intakeNumber, data]) => (
                <div
                  key={intakeNumber}
                  className="rounded-lg py-2 px-2 transition-colors"
                  style={{
                    cursor: onViewAnimal ? "pointer" : undefined,
                  }}
                  onClick={() => onViewAnimal?.(intakeNumber)}
                  onMouseEnter={(e) => {
                    if (onViewAnimal)
                      e.currentTarget.style.backgroundColor =
                        "var(--color-bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Animal header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono text-xs flex-shrink-0"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {intakeNumber}
                    </span>
                    <span
                      className="text-sm"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {data.species}
                    </span>
                  </div>
                  {/* Alert lines */}
                  <div className="space-y-0.5 pl-1">
                    {data.alerts.map((alert, i) => (
                      <p
                        key={i}
                        className="text-xs"
                        style={{ color: getSeverityColor(alert.severity) }}
                      >
                        {getSeverityIcon(alert.severity)} {alert.message}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All-clear animals (collapsed) */}
        {clearAnimals.length > 0 && (
          <div>
            <button
              onClick={() => setShowAllClear(!showAllClear)}
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              {animalsAllClear} looking good{" "}
              <span className="text-xs">
                {showAllClear ? "\u25B2" : "\u25BC"}
              </span>
            </button>
            {showAllClear && (
              <div className="mt-2 space-y-2">
                {clearAnimals.map(([intakeNumber, data]) => (
                  <div
                    key={intakeNumber}
                    className="rounded-lg py-1.5 px-2 transition-colors"
                    style={{
                      cursor: onViewAnimal ? "pointer" : undefined,
                    }}
                    onClick={() => onViewAnimal?.(intakeNumber)}
                    onMouseEnter={(e) => {
                      if (onViewAnimal)
                        e.currentTarget.style.backgroundColor =
                          "var(--color-bg-tertiary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs flex-shrink-0"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {intakeNumber}
                      </span>
                      <span
                        className="text-sm flex-1 min-w-0 truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {data.species}
                      </span>
                    </div>
                    {data.alerts.length > 0 && (
                      <p
                        className="text-xs pl-1 mt-0.5"
                        style={{ color: "var(--color-success)" }}
                      >
                        {data.alerts.map((a) => a.message).join(" \u00B7 ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hint */}
        {!allClear && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Tap a row for details.
          </p>
        )}
      </div>
    </Card>
  );
}
