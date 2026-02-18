"use client";

import { DailyCareLog } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";

interface CareLogsListProps {
  logs: DailyCareLog[];
}

export function CareLogsList({ logs }: CareLogsListProps) {
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
                {formatDateTime(log.log_date)}
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
          </div>
        ))}
      </div>
    </Card>
  );
}
