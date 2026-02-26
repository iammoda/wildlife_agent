"use client";

import { useEffect, useState } from "react";
import { DailyCareLog } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

interface CareLogConfirmationProps {
  log: DailyCareLog;
  intakeNumber: string;
  species: string;
  onUndo: (logId: string) => void;
  isProcessing?: boolean;
}

export function CareLogConfirmation({
  log,
  intakeNumber,
  species,
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
        <p className="text-sm text-primary-text">Care log undone.</p>
      </Card>
    );
  }

  return (
    <Card variant="bordered" className="space-y-2 animate-fadeIn card-accent-top">
      <div className="flex items-center gap-2">
        <span className="success-dot" aria-hidden="true">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="inline-icon"
          >
            <path
              d="M4 8.3L6.8 11L12 5.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Care log added for intake {intakeNumber} ({species})
        </span>
      </div>
      <div className="text-sm space-y-1" style={{ color: "var(--color-text-secondary)" }}>
        {(log.weight || log.food_fed) && (
          <p>
            {log.weight && <DetailRow label="Weight" value={log.weight} />}
            {log.weight && log.food_fed && <span> · </span>}
            {log.food_fed && (
              <DetailRow
                label="Fed"
                value={`${log.food_fed}${log.amount ? ` (${log.amount})` : ""}`}
              />
            )}
          </p>
        )}
        <p>
          <DetailRow label="Logged" value={formatDateTime(log.log_date)} />
        </p>
        {log.meds_and_comments && (
          <p>
            <DetailRow label="Notes" value={log.meds_and_comments} />
          </p>
        )}
      </div>
      {canUndo && (
        <div className="section-divider flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="btn-edit-subtle"
            onClick={handleUndo}
            disabled={isProcessing}
          >
            {isProcessing ? "Undoing..." : "Undo"}
          </Button>
          <span
            className="text-xs intake-pill"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-text-muted)",
            }}
          >
            {secondsLeft}s remaining
          </span>
        </div>
      )}
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-muted">
      {label}:
      <span className="ml-1 text-sm text-primary-text">{value}</span>
    </span>
  );
}
