"use client";

import { useEffect, useState } from "react";
import { DailyCareLog, MedicationEntry } from "@/lib/types";
import { Card } from "@/components/ui/Card";

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
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setVisibleCount(5);
  }, [logs.length]);

  if (logs.length === 0) {
    return (
      <Card variant="bordered">
        <p
          className="text-sm text-center py-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          No care logs recorded yet.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="bordered" className="animate-fadeIn overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3
            className="font-title text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Care Logs
          </h3>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {Math.min(visibleCount, logs.length)} of{" "}
            {totalCount > logs.length ? totalCount : logs.length}
          </span>
        </div>

        {/* Log entries */}
        <div className="space-y-4">
          {logs.slice(0, visibleCount).map((log) => (
            <div key={log.id} className="space-y-1">
              {/* Date + weight */}
              <div className="flex items-center justify-between">
                <span
                  className="text-sm"
                  style={{ color: "var(--color-text-primary)" }}
                  suppressHydrationWarning
                >
                  {isMounted ? formatLocalDateTime(log.log_date) : ""}
                  {log.weight && (
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {" \u00B7 "}
                      {log.weight}
                    </span>
                  )}
                </span>
              </div>

              {/* Food */}
              {log.food_fed && (
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {log.food_fed}
                  {log.amount && ` (${log.amount})`}
                </p>
              )}

              {/* Stool / Aspiration */}
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
                      Aspiration{log.aspiration_notes ? `: ${log.aspiration_notes}` : ""}
                    </span>
                  )}
                </div>
              )}

              {/* Medications */}
              {(() => {
                const meds = log.medications as MedicationEntry[] | null | undefined;
                if (!meds || meds.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {meds.map((med, i) => (
                      <span
                        key={i}
                        className="text-xs"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {med.name}{med.amount ? ` ${med.amount}` : ""}
                      </span>
                    ))}
                  </div>
                );
              })()}

              {/* Notes */}
              {log.meds_and_comments && (
                <p
                  className="text-sm italic"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {log.meds_and_comments}
                </p>
              )}

              {/* Actions */}
              {(onEditLog || onDeleteLog) && (
                <div className="flex items-center gap-3 pt-0.5">
                  {confirmingDeleteId === log.id ? (
                    <>
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-error)" }}
                      >
                        Delete this log?
                      </span>
                      <button
                        className="text-xs transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                        onClick={() => setConfirmingDeleteId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="text-xs transition-colors"
                        style={{ color: "var(--color-error)" }}
                        onClick={() => {
                          onDeleteLog?.(log.id);
                          setConfirmingDeleteId(null);
                        }}
                      >
                        Confirm
                      </button>
                    </>
                  ) : (
                    <>
                      {onEditLog && (
                        <button
                          className="text-xs transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          onClick={() => onEditLog(log)}
                        >
                          Edit
                        </button>
                      )}
                      {onDeleteLog && (
                        <button
                          className="text-xs transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          onClick={() => setConfirmingDeleteId(log.id)}
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show more */}
        {visibleCount < logs.length && (
          <button
            onClick={() =>
              setVisibleCount((prev) => Math.min(prev + 5, logs.length))
            }
            className="text-xs transition-colors"
            style={{ color: "var(--color-brand-accent)" }}
          >
            Show {Math.min(5, logs.length - visibleCount)} more
          </button>
        )}
      </div>
    </Card>
  );
}

function formatLocalDateTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
