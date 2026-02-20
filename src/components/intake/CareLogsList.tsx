"use client";

import { useEffect, useState } from "react";
import { DailyCareLog } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CareLogsListProps {
  logs: DailyCareLog[];
  onEditLog?: (log: DailyCareLog) => void;
  onDeleteLog?: (logId: string) => void;
}

export function CareLogsList({
  logs,
  onEditLog,
  onDeleteLog,
}: CareLogsListProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatLocalDateTime = (input: string | Date) => {
    const date = typeof input === "string" ? new Date(input) : input;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone:
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    }).format(date);
  };

  if (logs.length === 0) {
    return (
      <Card variant="bordered">
        <p className="text-sm text-secondary-text text-center py-4">
          No care logs recorded yet.
        </p>
      </Card>
    );
  }
  return (
    <Card variant="bordered" className="space-y-3">
      <h3 className="font-semibold text-primary-text">Care Logs</h3>
      <div className="space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="pb-3 border-b border-soft-mist last:pb-0 last:border-0"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-primary-text">
                <span suppressHydrationWarning>
                  {isMounted ? formatLocalDateTime(log.log_date) : ""}
                </span>
              </span>
              {log.weight && (
                <span className="text-sm text-wildlife-green font-medium">
                  {log.weight}
                </span>
              )}
            </div>
            <div className="text-sm text-secondary-text space-y-1">
              {log.food_fed && (
                <p>
                  Fed: {log.food_fed}
                  {log.amount && ` (${log.amount})`}
                </p>
              )}
              {log.meds_and_comments && <p>{log.meds_and_comments}</p>}
            </div>
            {(onEditLog || onDeleteLog) && (
              <div className="flex gap-2 mt-2">
                {onEditLog && (
                  <Button variant="ghost" size="sm" onClick={() => onEditLog(log)}>
                    Edit
                  </Button>
                )}
                {onDeleteLog && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteLog(log.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
