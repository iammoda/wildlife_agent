"use client";

import { useEffect, useState } from "react";
import { DailyCareLog, CareLogTrendSummary, MedicationEntry } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface CareLogConfirmationProps {
  log: DailyCareLog;
  intakeNumber: string;
  species: string;
  trendSummary?: CareLogTrendSummary;
  onUndo: (logId: string) => void;
  isProcessing?: boolean;
}

export function CareLogConfirmation({
  log,
  intakeNumber,
  species,
  trendSummary,
  onUndo,
  isProcessing = false,
}: CareLogConfirmationProps) {
  const [canUndo, setCanUndo] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [isUndone, setIsUndone] = useState(false);

  useEffect(() => {
    if (!canUndo) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCanUndo(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [canUndo]);

  const handleUndo = () => {
    if (canUndo && !isUndone && !isProcessing) {
      setIsUndone(true);
      onUndo(log.id);
    }
  };

  if (isUndone) {
    return (
      <Card variant="bordered" className="animate-fadeIn">
        <p className="text-sm p-4" style={{ color: "var(--color-text-muted)" }}>
          Care log undone.
        </p>
      </Card>
    );
  }

  // Build compact data line
  const dataParts: string[] = [];
  if (log.weight) dataParts.push(log.weight);
  if (log.food_fed) {
    dataParts.push(`${log.food_fed}${log.amount ? ` (${log.amount})` : ""}`);
  }

  const medications = log.medications as MedicationEntry[] | null | undefined;

  return (
    <Card variant="bordered" className="animate-fadeIn overflow-hidden">
      <div className="p-4 space-y-1.5">
        {/* Headline */}
        <p
          className="text-sm font-medium"
          style={{ color: "var(--color-text-primary)" }}
        >
          Care log saved{" "}
          <span style={{ color: "var(--color-text-muted)" }}>
            {"\u00B7"} {intakeNumber}
          </span>
        </p>

        {/* Data */}
        {dataParts.length > 0 && (
          <p
            className="text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {dataParts.join(" \u00B7 ")}
          </p>
        )}

        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {formatDateTime(log.log_date)}
        </p>

        {/* Stool / Aspiration indicators */}
        {(log.stool || log.aspiration) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {log.stool && (
              <span
                className="text-xs"
                style={{
                  color:
                    log.stool === "diarrhea"
                      ? "var(--color-error)"
                      : log.stool === "none"
                        ? "var(--color-brand-accent)"
                        : "var(--color-text-muted)",
                }}
              >
                Stool: {log.stool === "normal" ? "Normal" : log.stool === "diarrhea" ? "Diarrhea" : "None"}
              </span>
            )}
            {log.aspiration && (
              <span
                className="text-xs font-medium"
                style={{ color: "var(--color-error)" }}
              >
                Aspiration
              </span>
            )}
          </div>
        )}

        {/* Medications */}
        {medications && medications.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {medications.map((med, i) => (
              <span
                key={i}
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {med.name}{med.amount ? ` ${med.amount}` : ""}
              </span>
            ))}
          </div>
        )}

        {log.meds_and_comments && (
          <p
            className="text-sm italic"
            style={{ color: "var(--color-text-muted)" }}
          >
            {log.meds_and_comments}
          </p>
        )}

        {/* Trend Summary */}
        {trendSummary && <TrendSummaryLine summary={trendSummary} />}
      </div>

      {/* Undo */}
      {canUndo && (
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ borderTop: "1px solid var(--color-border-light)" }}
        >
          <button
            onClick={handleUndo}
            disabled={isProcessing}
            className="text-xs font-medium transition-colors"
            style={{ color: "var(--color-brand-accent)" }}
          >
            {isProcessing ? "Undoing..." : "Undo"}
          </button>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {secondsLeft}s
          </span>
        </div>
      )}
    </Card>
  );
}

function TrendSummaryLine({ summary }: { summary: CareLogTrendSummary }) {
  const parts: React.ReactNode[] = [];

  // Weight trend
  if (summary.weightTrend !== "unknown") {
    const weightDisplay =
      summary.weightValues && summary.weightValues.length > 1
        ? ` (${summary.weightValues.join(" \u2192 ")})`
        : "";

    if (summary.weightTrend === "up") {
      parts.push(
        <span key="weight" style={{ color: "var(--color-success)" }}>
          {"\u2191"} Weight increasing{weightDisplay}
        </span>
      );
    } else if (summary.weightTrend === "down") {
      parts.push(
        <span key="weight" style={{ color: "var(--color-error)" }}>
          {"\u2193"} Weight declining{weightDisplay}
        </span>
      );
    } else {
      parts.push(
        <span key="weight" style={{ color: "var(--color-text-secondary)" }}>
          {"\u2192"} Weight stable{weightDisplay}
        </span>
      );
    }
  }

  // Eating status
  if (summary.eatingWell !== null) {
    if (summary.eatingWell) {
      parts.push(
        <span key="eating" style={{ color: "var(--color-success)" }}>
          Eating well
        </span>
      );
    } else {
      parts.push(
        <span key="eating" style={{ color: "var(--color-error)" }}>
          Not eating
        </span>
      );
    }
  }

  // Stool status
  if (summary.stoolStatus !== "unknown") {
    if (summary.stoolStatus === "normal") {
      parts.push(
        <span key="stool" style={{ color: "var(--color-success)" }}>
          Stool normal
        </span>
      );
    } else if (summary.stoolStatus === "concern") {
      parts.push(
        <span key="stool" style={{ color: "var(--color-error)" }}>
          Stool concern
        </span>
      );
    } else if (summary.stoolStatus === "none") {
      parts.push(
        <span key="stool" style={{ color: "var(--color-brand-accent)" }}>
          No stool
        </span>
      );
    }
  }

  // Aspiration flag
  if (summary.aspirationFlag) {
    parts.push(
      <span key="aspiration" className="font-medium" style={{ color: "var(--color-error)" }}>
        Aspiration
      </span>
    );
  }

  if (parts.length === 0) return null;

  return (
    <p className="text-xs pt-1" style={{ color: "var(--color-text-muted)" }}>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && (
            <span style={{ color: "var(--color-text-muted)" }}> {"\u00B7"} </span>
          )}
          {part}
        </span>
      ))}
    </p>
  );
}

function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
