"use client";

import { useEffect, useState } from "react";
import { DailyCareLog } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface CareLogsListProps {
  logs: DailyCareLog[];
  totalCount: number;
  onEditLog?: (log: DailyCareLog) => void;
  onDeleteLog?: (logId: string) => void;
}

export function CareLogsList({
  logs,
  totalCount,
  onEditLog,
  onDeleteLog,
}: CareLogsListProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setVisibleCount(5);
  }, [logs.length]);

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
    <Card variant="bordered" className="space-y-2 animate-fadeIn">
      <h3 className="flex items-center gap-2 font-title text-lg font-semibold text-primary-text">
        <LeafIcon />
        <span>
          Care Logs · Showing {Math.min(visibleCount, logs.length)} of{" "}
          {totalCount > logs.length ? totalCount : logs.length}
        </span>
      </h3>
      <div className="space-y-2">
        {logs.slice(0, visibleCount).map((log) => (
          <div
            key={log.id}
            className="intake-row-accent border-b py-2 px-3 last:border-0"
            style={{ borderColor: "var(--color-border-light)" }}
          >
            <div className="flex items-center justify-between mb-1 text-xs text-secondary-text">
              <div className="meta-row">
                <ClockIcon />
                <span suppressHydrationWarning>
                  {isMounted ? formatLocalDateTime(log.log_date) : ""}
                </span>
              </div>
              {log.weight && (
                <span className="weight-pill">
                  {log.weight}
                </span>
              )}
            </div>
            <div className="text-sm text-secondary-text space-y-1">
              {log.food_fed && (
                <p>
                  <span style={{ color: "var(--color-brand-accent)" }}>Fed:</span>{" "}
                  {log.food_fed}
                  {log.amount && ` (${log.amount})`}
                </p>
              )}
              {log.meds_and_comments && <p className="italic text-muted">{log.meds_and_comments}</p>}
            </div>
            {(onEditLog || onDeleteLog) && (
              <div className="flex gap-2 mt-2 ml-auto justify-end">
                {onEditLog && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-edit-subtle text-xs"
                    onClick={() => onEditLog(log)}
                  >
                    Edit
                  </Button>
                )}
                {onDeleteLog && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-delete-ghost text-xs"
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
      {visibleCount < logs.length && (
        <button
          onClick={() =>
            setVisibleCount((prev) => Math.min(prev + 5, logs.length))
          }
          className="w-full py-2 text-xs text-center rounded-lg btn-edit-subtle"
        >
          Show {Math.min(5, logs.length - visibleCount)} more (
          {logs.length - visibleCount} remaining)
        </button>
      )}
    </Card>
  );
}

function LeafIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-icon"
      aria-hidden="true"
      style={{ color: "var(--color-brand-primary)" }}
    >
      <path
        d="M8 14C11.3137 14 14 11.3137 14 8C10.6863 8 8 10.6863 8 14Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path d="M8 14V6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 6C9.7 5.7 11.1 4.3 11.4 2.6C9.7 2.9 8.3 4.3 8 6Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-icon inline-icon-muted"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5.2V8.2L10 9.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
