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
      <Card variant="bordered">
        <p className="text-sm text-primary-text">Care log undone.</p>
      </Card>
    );
  }

  return (
    <Card variant="bordered" className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: "var(--color-brand-primary)" }}>
          OK
        </span>
        <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
          Care log added for intake {intakeNumber} ({species})
        </span>
      </div>
      <div
        className="text-sm grid grid-cols-2 gap-x-4 gap-y-1"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {log.weight && <span>Weight: {log.weight}</span>}
        {log.food_fed && (
          <span>
            Fed: {log.food_fed}
            {log.amount && ` (${log.amount})`}
          </span>
        )}
        <span className="col-span-2">{formatDateTime(log.log_date)}</span>
        {log.meds_and_comments && (
          <span className="col-span-2">{log.meds_and_comments}</span>
        )}
      </div>
      {canUndo && (
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={isProcessing}
          >
            {isProcessing ? "Undoing..." : "Undo"}
          </Button>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            ({secondsLeft}s)
          </span>
        </div>
      )}
    </Card>
  );
}
